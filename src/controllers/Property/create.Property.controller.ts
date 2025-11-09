// Todos direitos autorais reservados pelo QOTA.

/**
 * Controller para Criação de Novas Propriedades
 *
 * Descrição:
 * Este arquivo contém a lógica de negócio para o endpoint de criação de novas
 * propriedades. O processo é seguro e transacional.
 *
 * O controlador executa as seguintes ações em uma única operação atômica:
 * 1.  Cria o registro da nova propriedade, calculando o direito a diárias por fração.
 * 2.  Cria um vínculo que designa o usuário autenticado como o "proprietario_master",
 * atribuindo a ele todas as frações iniciais e o saldo total de diárias para o ano.
 * 3.  Dispara uma notificação em segundo plano sobre a criação da propriedade.
 */
import { prisma } from '../../utils/prisma';
import { Request, Response } from 'express';
import { z } from 'zod';
import { createNotification } from '../../utils/notification.service';
import { logEvents } from '../../middleware/logEvents';

// Define o nome do arquivo de log para este controlador.
const LOG_FILE = 'property.log';

// Schema para validar os dados de entrada da criação da propriedade.
const createPropertySchema = z.object({
  nomePropriedade: z.string().min(1, { message: 'O nome da propriedade é obrigatório.' }).max(100),
  tipo: z.enum(['Casa', 'Apartamento', 'Chacara', 'Lote', 'Outros']),
  totalFracoes: z.number().int().min(1).max(52).optional().default(52),
  enderecoCep: z.string().optional(),
  enderecoCidade: z.string().optional(),
  enderecoBairro: z.string().optional(),
  enderecoLogradouro: z.string().optional(),
  enderecoNumero: z.string().optional(),
  enderecoComplemento: z.string().optional(),
  enderecoPontoReferencia: z.string().optional(),
  valorEstimado: z.number().positive().optional().nullable(),
});

/**
 * Processa a criação de uma nova propriedade e o vínculo com seu criador.
 */
export const createProperty = async (req: Request, res: Response) => {
  try {
    // --- 1. Autenticação e Validação de Entrada ---
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    const { id: userId, nomeCompleto: userName } = req.user;
    const { totalFracoes, ...propertyData } = createPropertySchema.parse(req.body);

    // --- 2. Preparação dos Dados para o Novo Fluxo ---
    // Calcula o número de dias a que cada fração da propriedade dá direito.
    const diariasPorFracao = 365 / totalFracoes;

    // Calcula o saldo pro-rata para o ano atual
    const hoje = new Date();
    const inicioDoAno = new Date(hoje.getFullYear(), 0, 1);
    const fimDoAno = new Date(hoje.getFullYear(), 11, 31);
    // Calcula os dias totais no ano (lidando com anos bissextos)
    const diasTotaisNoAno = (fimDoAno.getTime() - inicioDoAno.getTime()) / (1000 * 3600 * 24) + 1;
    // Calcula os dias restantes (incluindo hoje)
    const diasRestantesNoAno = Math.max(0, (fimDoAno.getTime() - hoje.getTime()) / (1000 * 3600 * 24) + 1);
    const proporcaoAnoRestante = diasRestantesNoAno / diasTotaisNoAno;

    // O saldo anual total (para o próximo ano) é 365 dias, pois o master detém todas as frações.
    const saldoAnualTotalMaster = totalFracoes * diariasPorFracao; // = 365

    // O saldo do ano atual é proporcional aos dias restantes.
    const saldoProRataMaster = saldoAnualTotalMaster * proporcaoAnoRestante;

    // --- 3. Criação da Propriedade e Vínculo do Proprietário (Transacional) ---
    // A propriedade e o vínculo são criados em uma única operação aninhada.
    const newProperty = await prisma.propriedades.create({
      data: {
        ...propertyData,
        totalFracoes,
        diariasPorFracao,
        usuarios: {
          create: [
            {
              idUsuario: userId,
              permissao: 'proprietario_master',
              numeroDeFracoes: totalFracoes, // O criador recebe todas as frações inicialmente.
              saldoDiariasAtual: saldoProRataMaster, // Saldo proporcional ao restante do ano.
              saldoDiariasFuturo: saldoAnualTotalMaster, // Saldo integral (365) para o próximo ano.
            },
          ],
        },
      },
    });

    // --- 4. Disparo da Notificação (Desempenho) ---
    // A notificação é disparada sem 'await' para não bloquear a resposta ao usuário.
    createNotification({
      idPropriedade: newProperty.id,
      idAutor: userId,
      mensagem: `A propriedade '${newProperty.nomePropriedade}' foi criada por '${userName}'.`,
    }).catch(err => {
      logEvents(`Falha ao criar notificação para nova propriedade: ${err.message}`, LOG_FILE);
    });

    // --- 5. Envio da Resposta de Sucesso ---
    return res.status(201).json({
      success: true,
      message: `Propriedade "${newProperty.nomePropriedade}" criada com sucesso.`,
      data: {
        id: newProperty.id,
        nomePropriedade: newProperty.nomePropriedade,
        tipo: newProperty.tipo,
        dataCadastro: newProperty.dataCadastro,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues[0].message });
    }

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logEvents(`ERRO ao criar propriedade: ${errorMessage}\n${error instanceof Error ? error.stack : ''}`, LOG_FILE);

    return res.status(500).json({
      success: false,
      message: 'Ocorreu um erro inesperado no servidor ao criar a propriedade.',
    });
  }
};