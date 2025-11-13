# QOTA - API Back-end (Documentação Técnica)

API de back-end robusta e monolítica para o sistema **QOTA**, uma plataforma SaaS desenvolvida para o gerenciamento inteligente de propriedades compartilhadas (multi-propriedade).

---

## Sumário

- [1. Visão Geral](#1-visão-geral)
- [2. Arquitetura](#2-arquitetura)
  - [2.1. Diagrama de Componentes](#21-diagrama-de-componentes)
- [3. Diagramas UML](#3-diagramas-uml)
  - [3.1. Diagrama de Casos de Uso](#31-diagrama-de-casos-de-uso)
  - [3.2. Diagrama de Classes (Modelo de Domínio)](#32-diagrama-de-classes-modelo-de-domínio)
  - [3.3. Diagramas de Estado](#33-diagramas-de-estado)
- [4. Tecnologias](#4-tecnologias)
- [5. Pré-requisitos](#5-pré-requisitos)
- [6. Instalação](#6-instalação)
- [7. Configuração (Variáveis de Ambiente)](#7-configuração-variáveis-de-ambiente)
- [8. Banco de Dados](#8-banco-de-dados)
- [9. Executando Localmente](#9-executando-localmente)
- [10. Testes](#10-testes)
- [11. CI/CD](#11-cicd)
- [12. Logging e Monitoramento](#12-logging-e-monitoramento)
- [13. Segurança e Autenticação](#13-segurança-e-autenticação)
- [14. Modelos de Dados (Schema Prisma)](#14-modelos-de-dados-schema-prisma)
- [15. Jobs Agendados (Cron)](#15-jobs-agendados-cron)
- [16. Documentação da API (Endpoints)](#16-documentação-da-api-endpoints)
  - [16.1. Auth](#161-auth)
  - [16.2. User](#162-user)
  - [16.3. Property](#163-property)
  - [16.4. Permission](#164-permission)
  - [16.5. Invite](#165-invite)
  - [16.6. Calendar](#166-calendar)
  - [16.7. Financial](#167-financial)
  - [16.8. Inventory](#168-inventory)
  - [16.9. Inventory Photo](#169-inventory-photo)
  - [16.10. Property Photo](#1610-property-photo)
  - [16.11. Property Documents](#1611-property-documents)
  - [16.12. Notification](#1612-notification)
  - [16.13. Validation](#1613-validation)
- [17. Contribuindo](#17-contribuindo)
- [18. Licença](#18-licença)

---

## 1. Visão Geral

Este repositório contém o código-fonte da API back-end para o sistema QOTA. Trata-se de uma API RESTful monolítica construída em Node.js e Express, responsável por gerenciar toda a lógica de negócio, persistência de dados e autenticação da plataforma.

O sistema resolve o complexo problema de gerenciamento de propriedades compartilhadas (multi-propriedade), automatizando a governança entre os coproprietários.

### Principais Funcionalidades do Back-end:

####  Gestão de Identidade e Acesso
* **Autenticação Robusta:** Login seguro com JWT (Access Token) e renovação de sessão via Refresh Token (Cookie HttpOnly).
* **Direito ao Esquecimento:** Funcionalidade de encerramento de conta com *soft delete* e anonimização automática de dados sensíveis (CPF, E-mail).
* **Controle de Acesso (RBAC):** Sistema de permissões granulares (Admin, Proprietário Master, Proprietário Comum).

####  Governança da Propriedade
* **Gestão de Cotas (Frações):** Controle matemático preciso da porcentagem de posse (frações) de cada usuário.
* **Sistema de Convites:** Geração de tokens seguros para convidar novos membros, com validação de disponibilidade de frações do "pool" da propriedade ou do proprietário master.
* **Documentação Digital:** Upload e armazenamento seguro de escrituras e documentos legais da propriedade.
* **Galeria de Fotos:** Gerenciamento de imagens da propriedade.

####  Motor de Reservas e Calendário
* **Saldo de Diárias Inteligente (Dual-Pot):** Lógica avançada que gerencia dois saldos de diárias simultâneos (Ano Corrente vs. Ano Futuro) com cálculo *pro-rata*, prevenindo conflitos de agendamento na virada do ano.
* **Regras de Estadia:** Validação de duração mínima/máxima, antecedência e limites de ocupação.
* **Fluxo de Check-in/Check-out:** Registro de entrada e saída com *checklist* integrado do estado do inventário.
* **Penalidades:** Aplicação automática ou manual de penalidades por cancelamento tardio ou infrações.

####  Gestão Financeira e Rateio
* **Rateio Automático:** Cálculo automático da divisão de despesas entre os cotistas baseado no número de frações, com tratamento de arredondamento financeiro ("centavo perdido").
* **Processamento via IA (OCR):** Integração para leitura automática de faturas (PDF/Imagem) e extração de dados (valor, vencimento) para cadastro rápido.
* **Despesas Recorrentes:** Automação para geração de despesas fixas (condomínio, internet) via *Jobs*.
* **Controle de Pagamentos:** Acompanhamento individual de status de pagamento por cotista.
* **Relatórios e Dashboard:** Geração de relatórios em PDF (via Puppeteer) e endpoints analíticos para dashboards financeiros.

####  Gestão de Inventário
* **Controle de Bens:** Cadastro de itens (mobília, eletrodomésticos) com status de conservação.
* **Histórico Visual:** Upload de fotos para documentar o estado dos itens do inventário.

####  Automação e Infraestrutura
* **Jobs Agendados (Cron):** Rotinas automáticas para renovação anual de saldos (Rollover), monitoramento de inadimplência e geração de recorrências.
* **Validação de Endereço:** Integração com serviço de OCR para validar comprovantes de residência.
* **Notificações:** Sistema de notificação interna para eventos relevantes (novas despesas, convites, reservas).

O projeto está com todos os módulos principais implementados e cobertos por testes de integração.