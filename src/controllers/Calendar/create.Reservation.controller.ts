// Todos direitos autorais reservados pelo QOTA.

/**
 * Controller para Criação de Reservas
 *
 * Descrição:
 * Este arquivo contém a lógica para o endpoint de criação de uma nova reserva.
 * É um dos controladores mais críticos do sistema, implementando uma robusta
 * camada de validação para garantir a integridade das regras de negócio.
 *
 * O processo é responsável por:
 * 1.  Validar a autenticação, autorização (se o usuário é membro) e os dados da reserva.
 * 2.  Verificar regras de estadia (duração mínima/máxima).
 * 3.  Verificar o saldo de diárias do usuário (lógica de "potes" anuais).
 * 4.  Validar limites de reservas ativas e de feriados (chamada externa).
 * 5.  Criar a reserva e debitar o saldo de diárias correto (atual ou futuro)
 * em uma única transação atômica.
 * 6.  Disparar uma notificação em segundo plano.
 */
import { prisma } from '../../utils/prisma';
import { Request, Response } from 'express';
import { z } from 'zod';
import { createNotification } from '../../utils/notification.service';
import { Prisma } from '@prisma/client';
import { differenceInDays, isWithinInterval } from 'date-fns'; 
import axios from 'axios';
import { logEvents } from '../../middleware/logEvents';

// Define o nome do arquivo de log e o tipo para o cliente de transação.
const LOG_FILE = 'calendar.log';
type TransactionClient = Omit<Prisma.TransactionClient, '$commit' | '$rollback'>;

// --- Schemas de Validação ---
const createReservationSchema = z.object({
  idPropriedade: z.number().int().positive(),
  dataInicio: z.string().datetime({ message: "A data de início é inválida." }),
  dataFim: z.string().datetime({ message: "A data de fim é inválida." }),
  numeroHospedes: z.number().int().positive({ message: "O número de hóspedes deve ser maior que zero." }),
});

/**
 * Função auxiliar para buscar feriados nacionais de um ano na BrasilAPI.
 * @param {number} year - O ano para o qual os feriados serão buscados.
 * @returns {Promise<Date[]>} Uma lista de objetos Date dos feriados.
 */
const getHolidaysForYear = async (year: number): Promise<Date[]> => {
    try {
        const response = await axios.get(`https://brasilapi.com.br/api/feriados/v1/${year}`);
        return response.data.map((holiday: any) => new Date(`${holiday.date}T12:00:00Z`));
    } catch (error) {
        logEvents(`Falha ao buscar feriados para o ano ${year}: ${error}`, LOG_FILE);
        return [];
    }
};

/**
 * Processa a criação de uma nova reserva para um usuário em uma propriedade.
 */
export const createReservation = async (req: Request, res: Response) => {
  try {
    // --- 1. Autenticação e Validação de Entrada ---
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Usuário não autenticado." });
    }
    const { id: userId, nomeCompleto: userName } = req.user;
    const validatedData = createReservationSchema.parse(req.body);
    
    const dataInicio = new Date(validatedData.dataInicio);
    const dataFim = new Date(validatedData.dataFim);

    // --- 2. Busca de Permissões e Regras (Pré-Transação) ---
    const userLink = await prisma.usuariosPropriedades.findFirst({
        where: { idUsuario: userId, idPropriedade: validatedData.idPropriedade },
        include: { propriedade: true },
    });
    
    if (!userLink) {
        return res.status(403).json({ success: false, message: 'Acesso negado. Você não é membro desta propriedade.' });
    }
    const { propriedade } = userLink;

    // --- 3. Validações de Regras de Negócio ---

    // Validações de data e duração
    if (dataFim <= dataInicio) throw new Error("A data de fim deve ser posterior à data de início.");
    if (dataInicio < new Date(new Date().setHours(0, 0, 0, 0))) throw new Error("Não é possível criar uma reserva para uma data no passado.");
    
    const durationInDays = differenceInDays(dataFim, dataInicio);
    if (durationInDays < propriedade.duracaoMinimaEstadia) throw new Error(`A duração mínima da estadia é de ${propriedade.duracaoMinimaEstadia} dias.`);
    if (durationInDays > propriedade.duracaoMaximaEstadia) throw new Error(`A duração máxima da estadia é de ${propriedade.duracaoMaximaEstadia} dias.`);

    // --- 4. Validação de Saldo de Diárias ---
    const anoAtual = new Date().getFullYear();
    const anoDaReserva = dataInicio.getFullYear();

    let campoSaldo: 'saldoDiariasAtual' | 'saldoDiariasFuturo';
    let saldoDisponivel: number;

    if (anoDaReserva === anoAtual) {
      // Se a reserva é para o ano corrente, usa o saldo atual.
      campoSaldo = 'saldoDiariasAtual';
      saldoDisponivel = userLink.saldoDiariasAtual;
    } else if (anoDaReserva === anoAtual + 1) {
      // Se a reserva é para o próximo ano, usa o saldo futuro.
      campoSaldo = 'saldoDiariasFuturo';
      saldoDisponivel = userLink.saldoDiariasFuturo;
    } else {
      // Bloqueia agendamentos para mais de 1 ano no futuro.
      throw new Error(`Não é possível criar reservas para o ano de ${anoDaReserva}.`);
    }

    if (saldoDisponivel < durationInDays) {
      throw new Error(`Sua reserva de ${durationInDays} dias para ${anoDaReserva} excede seu saldo de ${Math.floor(saldoDisponivel)} dias para aquele ano.`);
    }

    // Validação de Limite de Reservas Ativas
    if (propriedade.limiteReservasAtivasPorCotista) {
      const activeReservationsCount = await prisma.reserva.count({
        where: { idUsuario: userId, idPropriedade: validatedData.idPropriedade, status: 'CONFIRMADA', dataInicio: { gte: new Date() } }
      });
      if (activeReservationsCount >= propriedade.limiteReservasAtivasPorCotista) {
        throw new Error(`Limite de ${propriedade.limiteReservasAtivasPorCotista} reservas ativas atingido.`);
      }
    }

    // Validação de Limite de Feriados (chamada externa fora da transação)
    if (propriedade.limiteFeriadosPorCotista && propriedade.limiteFeriadosPorCotista > 0) {
        const years = [...new Set([dataInicio.getFullYear(), dataFim.getFullYear()])];
        const allHolidays = (await Promise.all(years.map(getHolidaysForYear))).flat();
        const newHolidayCount = allHolidays.filter(h => isWithinInterval(h, { start: dataInicio, end: dataFim })).length;
        
        if (newHolidayCount > 0) {
            const userOtherReservations = await prisma.reserva.findMany({ where: { idUsuario: userId, idPropriedade: validatedData.idPropriedade, status: 'CONFIRMADA' } });
            let existingHolidayCount = 0;
            for (const r of userOtherReservations) {
                existingHolidayCount += allHolidays.filter(h => isWithinInterval(h, { start: r.dataInicio, end: r.dataFim })).length;
            }
            if (existingHolidayCount + newHolidayCount > propriedade.limiteFeriadosPorCotista) {
                throw new Error(`Limite de ${propriedade.limiteFeriadosPorCotista} feriado(s) atingido.`);
            }
        }
    }

    // --- 5. Execução da Lógica Transacional de Reserva ---
    const newReservation = await prisma.$transaction(async (tx: TransactionClient) => {
      // Validação Final de Conflito de Datas (dentro da transação para lock)
      const conflictingReservation = await tx.reserva.findFirst({
        where: {
          idPropriedade: validatedData.idPropriedade,
          status: { not: 'CANCELADA' },
          AND: [{ dataInicio: { lt: dataFim } }, { dataFim: { gt: dataInicio } }],
        },
      });
      if (conflictingReservation) throw new Error("As datas selecionadas já estão ocupadas.");

      // Cria a reserva no banco de dados.
      const reserva = await tx.reserva.create({
        data: {
          idPropriedade: validatedData.idPropriedade,
          idUsuario: userId,
          dataInicio,
          dataFim,
          numeroHospedes: validatedData.numeroHospedes,
        },
      });
      
      // Debita os dias do saldo do "pote" (atual ou futuro).
      await tx.usuariosPropriedades.update({
          where: { id: userLink.id },
          data: { [campoSaldo]: { decrement: durationInDays } }
      });

      return reserva;
    });

    // --- 6. Disparo da Notificação (Fire-and-Forget) ---
    createNotification({
      idPropriedade: newReservation.idPropriedade,
      idAutor: userId,
      mensagem: `O usuário '${userName}' agendou uma nova reserva na propriedade '${propriedade.nomePropriedade}' para o período de ${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}.`,
    }).catch(err => logEvents(`Falha ao criar notificação para nova reserva: ${err.message}`, LOG_FILE));

    // --- 7. Envio da Resposta de Sucesso ---
    return res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso.',
      data: newReservation,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues[0].message });
    }
    if (error instanceof Error) {
        return res.status(400).json({ success: false, message: error.message });
    }
    
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    logEvents(`ERRO ao criar reserva: ${errorMessage}\n${error instanceof Error ? error.stack : ''}`, LOG_FILE);

    return res.status(5.00).json({ success: false, message: 'Ocorreu um erro inesperado no servidor.' });
  }
};