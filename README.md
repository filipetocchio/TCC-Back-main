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


## 2. Arquitetura

A aplicação segue uma arquitetura de API monolítica robusta e modular, organizada em camadas lógicas para garantir a separação de responsabilidades (SoC - Separation of Concerns), facilitando a manutenção e a escalabilidade do código.

Os principais componentes arquiteturais são:

* **Servidor de Aplicação:** Desenvolvido em **Node.js** com o framework **Express**, atuando como o ponto central de entrada (API Gateway) para todas as requisições do cliente.
* **Camada de Dados (ORM):** O **Prisma** abstrai a comunicação com o banco de dados **SQLite** (ambiente de desenvolvimento), garantindo tipagem forte e segurança nas queries.
* **Camada de Validação:** A biblioteca **Zod** é utilizada para validar rigorosamente todos os dados de entrada (corpo, parâmetros e query strings) antes que eles atinjam a lógica de negócio.
* **Autenticação e Segurança:** Implementação de um sistema de autenticação *stateless* via **JWT** (JSON Web Tokens), utilizando uma estratégia de *Dual-Token* (Access Token de curta duração e Refresh Token em cookie `HttpOnly` de longa duração).
* **Gerenciamento de Arquivos:** O middleware **Multer** gerencia o upload e armazenamento local de arquivos (fotos, documentos) no diretório `/uploads`.
* **Serviços Externos e Integrações:**
    * **Microserviço de OCR:** Um serviço autônomo desenvolvido em **Python (Flask)**, responsável pelo processamento pesado de imagens e extração de texto via Tesseract/OpenCV. A comunicação é feita via HTTP (POST multipart).
    * **BrasilAPI:** API pública consumida para consulta de feriados nacionais, utilizada nas regras de agendamento.
* **Agendamento de Tarefas (Jobs):** O **node-cron** gerencia processos em segundo plano, como a renovação de saldos anuais e a geração de despesas recorrentes.
* **Tratamento de Erros:** Um middleware global centraliza a captura e formatação de erros, evitando vazamento de informações sensíveis e padronizando as respostas HTTP.

### 2.1. Diagrama de Componentes

O diagrama abaixo ilustra a interação entre os componentes internos do servidor, o banco de dados, o armazenamento de arquivos e os serviços externos.

![Diagrama de Componentes](docs/diagrams/component-diagram-qota.jpg)



## 3. Diagramas UML

Esta seção apresenta a modelagem visual do sistema, essencial para o entendimento dos fluxos de negócio, estrutura de dados e comportamento das entidades.

### 3.1. Diagrama de Casos de Uso

Este diagrama ilustra as principais funcionalidades (casos de uso) do sistema e como os diferentes atores (usuários e sistemas) interagem com elas. Ele detalha as permissões de cada perfil (Visitante, Cotista, Cotista Master, Administrador) e as interações com sistemas externos (OCR, BrasilAPI) e internos (Cron Jobs).

![Diagrama de Casos de Uso](docs/diagrams/use-case-qota.jpg)


### 3.2. Diagrama de Classes (Modelo de Domínio)

Este diagrama de classes ilustra as principais entidades do banco de dados (conforme o `schema.prisma`) e seus relacionamentos. Ele serve como referência para a estrutura de dados persistida, mostrando tabelas como `User`, `Propriedades`, `Reserva`, `Despesa`, e a tabela associativa crítica `UsuariosPropriedades` que gerencia as cotas e saldos.

![Diagrama de Classes](docs/diagrams/class-diagram-qota.jpg)


### 3.3. Diagramas de Estado

Estes diagramas modelam o ciclo de vida e as transições de estado para as três entidades mais dinâmicas do sistema:

1.  **Reserva:** Mostra o fluxo desde a criação (`CONFIRMADA`) até a conclusão (`CONCLUIDA`), cancelamento (`CANCELADA`) ou não comparecimento (`NO_SHOW`).
2.  **Despesa:** Detalha a evolução financeira, desde a criação (`PENDENTE`), passando por pagamentos parciais, atrasos, até a quitação total (`PAGO`).
3.  **Convite:** Ilustra a validade temporal do token de convite (`PENDENTE` -> `ACEITO` ou `EXPIRADO`).

![Diagramas de Estado](docs/diagrams/state-diagrams-qota.jpg)


### 3.4. Diagrama de Entidade-Relacionamento (DER)

O diagrama abaixo representa fielmente o schema do banco de dados, detalhando as tabelas, chaves primárias (PK), chaves estrangeiras (FK) e a cardinalidade dos relacionamentos.

![Diagrama de Entidade-Relacionamento (DER)](docs/diagrams/der-qota.jpg)




## 4. Tecnologias

A stack de tecnologia do back-end é composta por um monolito Node.js/TypeScript e um microserviço Python/Flask para tarefas de IA.


### API Principal (TCC-Back-main)

| Categoria | Tecnologia | Versão (do `package.json`) |
| :--- | :--- | :--- |
| **Runtime** | Node.js | `>=18.18.0` (v20+ recomendado) |
| **Linguagem** | TypeScript | `5.1.6` |
| **Framework** | Express | `^5.1.0` |
| **ORM** | Prisma | `6.5.0` |
| **Banco de Dados**| SQLite | (N/A - via Prisma) | PostgreSQL para Produção
| **Autenticação**| jsonwebtoken | `9.0.0` |
| **Hashing** | bcrypt | `5.1.0` |
| **Validação** | zod | `4.1.11` |
| **Uploads** | multer | `2.0.2` |
| **Cliente HTTP** | axios | `1.12.2` |
| **Geração PDF** | puppeteer | `^24.23.0` |
| **Jobs Agendados** | node-cron | `^4.2.1` |
| **Testes** | Jest | `29.7.0` |
| **Testes API** | supertest | `7.1.4` |



### Microserviço de OCR (Qota-OCR-Service)



| Categoria | Tecnologia | Função |
| :--- | :--- | :--- |
| **Framework** | Flask | Servidor API (em Python) |
| **Motor OCR** | Tesseract (`pytesseract`) | Reconhecimento Óptico de Caracteres |
| **NLP** | spaCy | Reconhecimento de Entidades (NER) |
| **Process. Imagem** | OpenCV (`cv2`) | Pré-processamento de imagens para OCR |
| **Manipulação PDF** | PyMuPDF (`fitz`) | Extração de texto nativo de PDF |
| **Conversão PDF** | `pdf2image` | Conversão de PDF em imagem para OCR |


## 5. Pré-requisitos

Para compilar, executar e testar o sistema QOTA localmente em sua totalidade (API principal e microsserviço de OCR), o seguinte software deve estar instalado e configurado no ambiente de desenvolvimento:

### API Principal (Node.js)

* **Node.js:** É recomendada a versão **v20.x**. A versão mínima suportada, conforme o arquivo `.nvmrc` e a pipeline de CI, é a **v18.16.0**.
* **NPM (Node Package Manager):** Versão `9.x` ou `10.x` (geralmente instalada automaticamente com o Node.js).
* **Git:** Essencial para clonar o repositório e gerenciar o versionamento.
* **SQLite3 (Biblioteca Nativa):** O Prisma ORM requer a biblioteca C do SQLite para interagir com o banco de dados.
    * **Linux (Debian/Ubuntu):** `sudo apt-get install -y sqlite3 libsqlite3-dev`
    * **macOS (Homebrew):** `brew install sqlite3`
    * **Windows:** O driver já vem incluído na maioria das instalações do Node.js.





## 6. Instalação

Siga os passos abaixo para configurar o ambiente de desenvolvimento da API principal (Node.js).

Em um **novo terminal**, navegue até a pasta raiz do projeto novamente.

1.  **Clonar o Repositório**
    

```bash

# Navegue até o diretório onde deseja salvar o projeto e clone o repositório:
 git clone [https://github.com/filipetocchio/TCC-Back-main.git](https://github.com/filipetocchio/TCC-Back-main.git)


# Navegue até a pasta do backend
cd TCC-Back-main

# Instale as dependências
npm install

**Continue os comandos no terminal do backend:**

```bash
# Gere o cliente Prisma
npx prisma generate

```




## 7. Configuração (Variáveis de Ambiente)

A API é configurada usando variáveis de ambiente, que devem ser fornecidas em um arquivo `.env` localizado na raiz do projeto (`TCC-Back-main/.env`).


Copie o conteúdo do arquivo `Instruções_para_rodar.md` (ou use a tabela abaixo como referência) para criar seu arquivo `.env` local.


| Variável | Descrição | Exemplo (Desenvolvimento) |
| :--- | :--- | :--- |
| `PORT` | Porta onde o servidor Express irá rodar. | `8001` |
| `ALLOWED_ORIGINS` | URLs do front-end permitidas pelo CORS (separadas por vírgula). | `http://localhost:3000` |
| `FRONTEND_URL` | URL base do front-end (usada para gerar links de convite). | `http://localhost:3000` |
| `NODE_ENV` | Define o ambiente de execução (`development` ou `production`). | `development` |
| `ACCESS_TOKEN_SECRET`| Chave secreta (string longa) para assinar Access Tokens JWT. | `chave_secreta_para_access_token_qota` |
| `REFRESH_TOKEN_SECRET`| Chave secreta (string longa) para assinar Refresh Tokens JWT. | `chave_secreta_para_refresh_token_qota` |
| `DATABASE_URL` | String de conexão com o banco de dados Prisma. | `file:./prisma/dev.db` |
| `OCR_SERVICE_URL` | Endpoint completo do microsserviço de OCR (Python/Flask). | `http://localhost:8000/processar-documento` |
| `SYSTEM_USER_ID` | (Implícito) ID do usuário "Sistema" para notificações de Jobs. | `1` |




**Crie o arquivo .env na raiz de 'TCC-Back-main' e copie o conteúdo abaixo,**
**ajustando as chaves secretas se desejar.**



**Conteúdo para o arquivo `.env` do Backend:**

```env
# Porta do servidor backend
PORT=8001

# URL do frontend
ALLOWED_ORIGINS="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"

# Ambiente de execução
NODE_ENV="development"

# Segredos para tokens JWT 
ACCESS_TOKEN_SECRET="chave_secreta_para_access_token_qota"
REFRESH_TOKEN_SECRET="chave_secreta_para_refresh_token_qota"

# URL do banco de dados (SQLite para dev)
DATABASE_URL="file:./prisma/dev.db"

# URL do microsserviço de OCR 
OCR_SERVICE_URL="http://localhost:8000/processar-documento"
```




## 8. Banco de Dados

A aplicação utiliza o **Prisma** como ORM (Object-Relational Mapper) para abstrair a comunicação com o banco de dados, garantindo tipagem forte, segurança contra SQL Injection e gerenciamento de schema.

* **Schema (Fonte da Verdade):** A estrutura completa de dados, incluindo tabelas (models), campos, tipos e relacionamentos, está definida em `prisma/schema.prisma`.
* **Banco de Desenvolvimento:** Conforme configurado em `DATABASE_URL` no arquivo `.env`, o ambiente de desenvolvimento utiliza **SQLite** (ex: `file:./prisma/dev.db`).
* **Banco de Testes (CI):** A pipeline de CI (`ci.yml`) também é configurada para rodar em **SQLite**.

### 8.1. Migrations (Evolução do Schema)

As migrações do banco de dados (histórico de alterações) são gerenciadas pelo Prisma CLI.

**Para aplicar as migrações** (ou criar o banco de dados pela primeira vez no desenvolvimento), execute:

```bash
# Sincroniza o banco com o schema e aplica migrações pendentes
npx prisma migrate dev
```

**Para criar uma nova migração** após modificar o arquivo schema.prisma:


```bash
# O Prisma solicitará um nome para a nova migração
npx prisma migrate dev --name "nome-da-sua-migracao"
```

###  8.2. Prisma Studio (Gerenciador Visual)

O Prisma inclui uma ferramenta visual baseada na web para visualizar, consultar e editar os dados do seu banco de dados local. Para iniciá-la, execute:

```bash
npx prisma studio
```

O Studio abrirá automaticamente no seu navegador, permitindo a manipulação direta dos dados nas tabelas (User, Propriedades, Reserva, etc.).




## 9. Executando Localmente

A aplicação está configurada para ser executada em dois modos principais: desenvolvimento (com hot-reload) e produção (compilado).


### 9.1. Modo de Desenvolvimento

Este modo utiliza o `nodemon` e o `ts-node` para monitorar alterações nos arquivos (`.ts`) e reiniciar o servidor automaticamente, agilizando o desenvolvimento.

Para iniciar o servidor em modo de desenvolvimento, execute:

```bash
# Este comando aciona o nodemon, que por sua vez executa o ts-node
npm run dev
```

>  **Nota:** Após a execução, o servidor estará disponível no `http://localhost:8001` (ou na porta definida em seu arquivo .env).



### 9.2. Modo de Produção

Este modo transpila o código `TypeScript` para `JavaScript` puro (na pasta /dist) e o executa diretamente com o Node.`js`, oferecendo a melhor performance.



**Compilar o Projeto:**

```Bash
# Transpila todo o código TypeScript (tsc) para JavaScript (na pasta /dist)
npm run build
```



**Iniciar o Servidor:**

```Bash

# Executa o script de inicialização do servidor transpilado
npm start

```



## 10. Testes

A aplicação possui uma suíte de testes de integração e unitários robusta, construída com **Jest**, **ts-jest** e **Supertest**, para garantir a confiabilidade e a corretude dos controllers e da lógica de negócio.

A estratégia de testes (`src/__tests__/`) é baseada em **mocking da camada de persistência**. Conforme definido em `jest.setup.ts`:

* **Mock do Prisma:** O `PrismaClient` é globalmente mockado usando `jest-mock-extended` (`mockDeep`). Isso isola os testes do banco de dados, permitindo a simulação de retornos (`prismaMock.user.findFirst.mockResolvedValue(...)`) e a asserção de chamadas, resultando em testes de integração extremamente rápidos e determinísticos.
* **Mock do Bcrypt:** A biblioteca `bcrypt` é mockada para que as operações de `hash` e `compare` sejam previsíveis e não consumam tempo de CPU.

### 10.1. Executando Testes

Os scripts para execução dos testes estão definidos no `package.json`:

**1. Executar a suíte de testes completa:**
Este comando é usado na pipeline de CI e para validação local.

```bash
npm test
```


**2. Executar em modo "Watch":**
Este comando monitora alterações nos arquivos de código e de teste, executando novamente apenas os testes relevantes, ideal para o ciclo de desenvolvimento.

```bash
npm run test:watch
```




## 11. CI / CD (Integração e Implantação Contínua)

O projeto utiliza **GitHub Actions** para Integração Contínua (CI). A configuração está definida no arquivo `.github/workflows/ci.yml`.

### 11.1. Gatilhos (Triggers)

O pipeline de CI é acionado automaticamente nos seguintes eventos:
* **`push`**: Em qualquer push para o branch `main`.
* **`pull_request`**: Na abertura ou atualização de um pull request direcionado ao branch `main`.

### 11.2. Etapas do Pipeline (`jobs: backend-ci`)

O job é executado em um ambiente `ubuntu-latest` e segue os seguintes passos para garantir a integridade do código:

1.  **Checkout:** Clona o repositório para o *runner* do GitHub.
    ```bash
    - name: Checkout repository
      uses: actions/checkout@v4
    ```

2.  **Setup Node.js:** Configura o ambiente de execução para Node.js v20, com cache de dependências `npm` ativado.
    ```bash
    - name: Setup Node.js environment
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    ```

3.  **Install System Dependencies:** Instala as bibliotecas de sistema necessárias para o Prisma e SQLite no runner Ubuntu.
    ```bash
    - name: Install System Dependencies for Prisma
      run: sudo apt-get update && sudo apt-get install -y sqlite3 libsqlite3-dev
    ```

4.  **Install Project Dependencies:** Instala os pacotes do projeto usando `npm ci` (Instalação limpa), que é mais rápido e seguro para CI do que `npm install`.
    ```bash
    - name: Install Project Dependencies
      run: npm ci
    ```

5.  **Generate Prisma Client:** Gera o cliente Prisma com base no schema.
    ```bash
    - name: Generate Prisma Client
      run: npx prisma generate
    ```

6.  **Run Prisma Migrations:** Executa as migrações do banco de dados em um ambiente de teste, utilizando um banco de dados definido nos *secrets* do GitHub.
    ```bash
    - name: Run Prisma Migrations
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL_TEST }} 
    ```

7.  **Run Automated Tests:** Executa a suíte de testes completa (`npm test`) com o Jest. Esta etapa também requer os *secrets* do GitHub para simular o ambiente de produção.
    ```bash
    - name: Run Automated Tests
      run: npm test
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL_TEST }}
        ACCESS_TOKEN_SECRET: ${{ secrets.ACCESS_TOKEN_SECRET_TEST }}
        REFRESH_TOKEN_SECRET: ${{ secrets.REFRESH_TOKEN_SECRET_TEST }}
    ```




## 12. Logging e Monitoramento

A API implementa uma estratégia de logging robusta baseada em arquivos, centralizada no módulo `src/middleware/logEvents.ts`. Esta abordagem permite a rastreabilidade de requisições, o monitoramento de erros e a auditoria de processos críticos.

### 12.1. Mecanismo de Log

A função utilitária `logEvents` é o núcleo do sistema de logging. Ela formata cada mensagem com:
* Timestamp (`yyyyMMdd\tHH:mm:ss`)
* Um ID de evento único (`uuid`)
* A mensagem de log

Essas entradas são anexadas de forma assíncrona (`fs.promises.appendFile`) aos arquivos de log correspondentes no diretório `/logs` (o diretório é criado se não existir).

### 12.2. Tipos de Logs Gerados

O sistema é configurado para gerar diferentes arquivos de log com base no contexto, permitindo uma depuração e monitoramento eficientes:

* **`logs/reqLog.txt`:**
    * **Fonte:** Middleware `logger` (`logEvents.ts`).
    * **Conteúdo:** Registra **todas** as requisições HTTP recebidas pela API, incluindo método, origem e URL. Essencial para rastrear o tráfego.

* **`logs/errLog.txt`:**
    * **Fonte:** Middleware `errorHandler` (`errorHandler.ts`).
    * **Conteúdo:** Captura **todos** os erros não tratados da aplicação (erros 500), erros de validação do Zod e erros do Prisma, incluindo o stack trace completo. Este é o log principal para monitoramento de falhas.

* **`logs/cron.log`:**
    * **Fonte:** Todos os Jobs em `src/jobs/`.
    * **Conteúdo:** Registra o início, a conclusão bem-sucedida ou falhas críticas dos processos agendados (ex: `runResetDailyBalancesJob`).

* **Logs Específicos de Módulo (ex: `financial.log`, `auth.log`, `inventory.log`):**
    * **Fonte:** Controllers específicos.
    * **Conteúdo:** Os controllers registram erros de lógica de negócio ou falhas específicas de seus domínios (ex: falha ao criar notificação, erro ao processar OCR).

### 12.3. Monitoramento

No estado atual da aplicação, o monitoramento é realizado através da **análise e observação direta dos arquivos de log gerados**. Não há integração nativa com serviços de monitoramento de performance de aplicação (APM) como Sentry ou Datadog. A observação do `errLog.txt` é a principal forma de identificar falhas em tempo real.





## 13. Segurança e Autenticação

A segurança da API QOTA é construída sobre padrões modernos de autenticação *stateless* (sem estado), autorização granular e proteção de dados em trânsito e em repouso. A arquitetura segue o princípio de "defesa em profundidade", onde várias camadas de segurança são aplicadas.


### 13.1. Estratégia de Tokens (JWT)

O sistema utiliza uma estratégia de **Dual-Token** para equilibrar segurança e experiência do usuário, baseada nos arquivos `login.Auth.controller.ts` e `refreshToken.Auth.controller.ts`:

1.  **Access Token (Curta Duração):**
    * **Formato:** JSON Web Token (JWT) assinado com `ACCESS_TOKEN_SECRET`.
    * **Validade:** 6 horas (definido no `login.Auth.controller.ts`).
    * **Transporte:** Header HTTP `Authorization: Bearer <token>`.
    * **Conteúdo (Payload):** `{ "userId": 1, "email": "...", "nomeCompleto": "..." }`.
    * **Uso:** Autenticação de requisições de API imediatas. É *stateless* e verificado pelo middleware `protect` (`authMiddleware.ts`).

2.  **Refresh Token (Longa Duração):**
    * **Formato:** JWT assinado com `REFRESH_TOKEN_SECRET`.
    * **Validade:** 7 dias (definido no `login.Auth.controller.ts`).
    * **Transporte:** Cookie HTTP-Only (`jwt`).
    * **Segurança:**
        * `httpOnly: true`: O token é inacessível por JavaScript no navegador, prevenindo roubo via ataques XSS.
        * `secure: true`: (Em produção) Garante que o cookie só seja enviado via HTTPS.
        * `sameSite: 'lax'`: Oferece proteção contra ataques CSRF.
    * **Uso:** Obtenção silenciosa de novos Access Tokens através da rota `/auth/refresh`.
    * **Invalidação:** O token é armazenado no banco de dados (`User.refreshToken`). No logout, ele é setado para `null`, invalidando a sessão no lado do servidor.

### 13.2. Fluxos de Autenticação

* **Login (`/auth/login`):**
    1.  Valida credenciais com `bcrypt.compare`.
    2.  Gera um novo Access Token e um novo Refresh Token.
    3.  Salva o hash do Refresh Token no `User.refreshToken` (invalidando sessões anteriores).
    4.  Envia o Access Token no corpo da resposta JSON.
    5.  Envia o Refresh Token no cookie `jwt`.

* **Refresh (`/auth/refresh`):**
    1.  O cliente envia o cookie `jwt` (o Refresh Token).
    2.  O servidor verifica se o token é válido e se ele existe no `User.refreshToken`.
    3.  Se sim, gera um **novo Access Token** e o retorna no corpo da resposta. O Refresh Token não é alterado.

* **Logout (`/auth/logout`):**
    1.  O servidor (protegido por JWT) recebe a requisição.
    2.  Define `User.refreshToken` como `null` no banco de dados, invalidando o token no lado do servidor.
    3.  Envia o comando `res.clearCookie('jwt')` para o cliente.

### 13.3. Controle de Acesso (Autorização)

O controle de acesso é aplicado em múltiplas camadas:

1.  **Nível de Rota (Autenticação):**

    * O middleware `protect` (`authMiddleware.ts`) é aplicado a todas as rotas privadas. Ele valida o Access Token (enviado via Header `Authorization`) e anexa `req.user` à requisição.

2.  **Nível de Rota (Administrativo):**

    * O middleware `verifyRoles` (`verifyRoles.ts`) é usado para rotas de superusuário (ex: `GET /user`), restringindo o acesso com base no `ROLES_LIST.Admin`.

3.  **Nível de Recurso (Lógica no Controller):**

    * Esta é a principal forma de autorização de negócios. Os controllers verificam o `req.user.id` contra o recurso solicitado (ex: `requesterId === targetUserId` no `update.User.controller`).

    * A permissão de gestão é verificada consultando o vínculo `UsuariosPropriedades` (ex: `permissao: 'proprietario_master'`). Isso é usado em dezenas de controllers (`update.Property`, `unlinkMember.Permission`, `cancel.Expense`, etc.).

### 13.4. Proteção de Dados e Validação

* **Validação de Entrada:** Todas as requisições que chegam à API (body, params, query) são rigorosamente validadas pelo `Zod`. O `errorHandler` captura `ZodError` e retorna uma resposta 400 padronizada, impedindo que dados malformados cheguem à lógica de negócio.

* **Hashing de Senha:** Senhas nunca são armazenadas em texto plano. O `bcrypt` (com 10 rounds de salt) é usado para criar hashes irreversíveis.

* **Prevenção de SQL Injection:** O uso exclusivo do **Prisma ORM** garante que todas as consultas ao banco de dados sejam parametrizadas e sanitizadas, eliminando o risco de injeção de SQL.

* **Upload de Arquivos:** O `Multer` (`upload.ts`) é configurado com filtros de tipo de arquivo (`fileFilter`) e limites de tamanho para prevenir o upload de arquivos maliciosos ou excessivamente grandes.


