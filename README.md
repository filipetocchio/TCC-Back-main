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







## 14. Modelos de Dados (Schema Prisma)

A estrutura completa do banco de dados, os relacionamentos e as restrições são definidos em um único arquivo: `prisma/schema.prisma`. Este schema é a "fonte única da verdade" (Single Source of Truth) para os dados, a partir do qual o Prisma gera o cliente e as tipagens TypeScript.

Abaixo estão as entidades (models) centrais que definem a lógica de negócio do QOTA.

### 14.1. User
Representa um usuário global da plataforma.
| Campo | Tipo (Prisma) | Descrição |
| :--- | :--- | :--- |
| `id` | `Int` | Chave Primária (PK), Auto-incremento. |
| `email` | `String` | Único. Usado para login. |
| `password` | `String` | Armazena o hash `bcrypt` da senha. |
| `nomeCompleto` | `String` | Nome de exibição do usuário. |
| `cpf` | `String` | Único. Documento do usuário. |
| `refreshToken` | `String?` | Armazena o Refresh Token JWT para persistência da sessão. |
| `excludedAt` | `DateTime?` | Usado para *soft delete* e anonimização (LGPD). |
| `propriedades` | `UsuariosPropriedades[]` | Relação N:N com `Propriedades` (via `UsuariosPropriedades`). |
| `reservas` | `Reserva[]` | Relação 1:N com `Reserva`. |
| `pagamentos` | `PagamentoCotista[]` | Relação 1:N com `PagamentoCotista`. |

### 14.2. Propriedades
Representa uma propriedade gerenciada.
| Campo | Tipo (Prisma) | Descrição |
| :--- | :--- | :--- |
| `id` | `Int` | PK, Auto-incremento. |
| `nomePropriedade` | `String` | Nome de exibição da propriedade. |
| `totalFracoes` | `Int` | O número total de cotas (ex: 52). |
| `diariasPorFracao` | `Float` | Valor calculado (365 / `totalFracoes`). |
| `prazoCancelamentoReserva` | `Int` | Regra de negócio (em dias). |
| `limiteFeriadosPorCotista` | `Int?` | Regra de negócio. |
| `limiteReservasAtivasPorCotista` | `Int?` | Regra de negócio. |
| `excludedAt` | `DateTime?` | Usado para *soft delete* da propriedade. |
| `usuarios` | `UsuariosPropriedades[]` | Relação N:N com `User` (via `UsuariosPropriedades`). |
| `reservas` | `Reserva[]` | Relação 1:N com `Reserva`. |
| `despesas` | `Despesa[]` | Relação 1:N com `Despesa`. |

### 14.3. UsuariosPropriedades (O Vínculo)
Esta é a tabela associativa (pivot table) mais importante do sistema, que armazena a permissão e os saldos de cada usuário para cada propriedade.

| Campo | Tipo (Prisma) | Descrição |
| :--- | :--- | :--- |
| `id` | `Int` | PK, Auto-incremento. |
| `idUsuario` | `Int` | Chave Estrangeira (FK) para `User`. |
| `idPropriedade` | `Int` | Chave Estrangeira (FK) para `Propriedades`. |
| `permissao` | `String` | "proprietario_master" ou "proprietario_comum". |
| `numeroDeFracoes` | `Int` | Quantidade de cotas que o usuário possui. |
| `saldoDiariasAtual`| `Float` | **Saldo pro-rata** para o ano corrente. |
| `saldoDiariasFuturo` | `Float` | **Saldo integral** para o próximo ano. |
| `@@unique([idUsuario, idPropriedade])` | N/A | Restrição que impede o mesmo usuário de se vincular duas vezes à mesma propriedade. |

### 14.4. Reserva
Entidade que armazena um agendamento no calendário.
| Campo | Tipo (Prisma) | Descrição |
| :--- | :--- | :--- |
| `id` | `Int` | PK, Auto-incremento. |
| `idPropriedade` | `Int` | FK para `Propriedades`. |
| `idUsuario` | `Int` | FK para `User` (o dono da reserva). |
| `dataInicio` | `DateTime` | Início da estadia. |
| `dataFim` | `DateTime` | Fim da estadia. |
| `status` | `StatusReserva` | Enum: `CONFIRMADA`, `CONCLUIDA`, `CANCELADA`. |
| `checklist` | `ChecklistInventario[]` | Relação 1:N com `ChecklistInventario`. |

### 14.5. Despesa
Entidade para registros financeiros. Pode ser um "template" (se `recorrente = true`) ou uma instância (se `recorrenciaPaiId != null`).
| Campo | Tipo (Prisma) | Descrição |
| :--- | :--- | :--- |
| `id` | `Int` | PK, Auto-incremento. |
| `idPropriedade` | `Int` | FK para `Propriedades`. |
| `criadoPorId` | `Int` | FK para `User` (quem registrou). |
| `recorrenciaPaiId` | `Int?` | FK para `Despesa` (auto-relacionamento). |
| `valor` | `Float` | Valor total da despesa. |
| `status` | `StatusPagamento` | Enum: `PENDENTE`, `PAGO`, `ATRASADO`, etc. |
| `recorrente` | `Boolean` | Flag que define se esta é uma despesa "modelo" para o Job. |
| `pagamentos` | `PagamentoCotista[]`| Relação 1:N com os rateios. |

### 14.6. PagamentoCotista
Entidade que armazena o rateio individual de uma despesa para um cotista específico.
| Campo | Tipo (Prisma) | Descrição |
| :--- | :--- | :--- |
| `id` | `Int` | PK, Auto-incremento. |
| `idDespesa` | `Int` | FK para `Despesa`. |
| `idCotista` | `Int` | FK para `User`. |
| `valorDevido` | `Float` | Valor calculado (`valorDespesa` * `proporcaoFracoes`). |
| `pago` | `Boolean` | Status do pagamento individual. |
| `@@unique([idDespesa, idCotista])` | N/A | Restrição que impede o mesmo cotista de ter dois rateios para a mesma despesa. |




## 15. Jobs Agendados (Cron)

A API utiliza o pacote `node-cron` para agendar e executar tarefas de manutenção críticas de forma automática. As tarefas são configuradas e iniciadas no arquivo principal do servidor (`src/server.ts`).

### 15.1. Renovação Anual de Saldos de Diárias

* **Arquivo:** `src/jobs/resetDailyBalances.job.ts`
* **Agendamento:** `0 0 1 1 *` (À meia-noite do dia 1º de Janeiro).
* **Fuso Horário:** `America/Sao_Paulo`
* **Descrição:** Este é o job mais crítico para a lógica de negócio de "dois potes". Ele executa a "rolagem" (rollover) anual dos saldos de todos os cotistas do sistema:
    1.  O `saldoDiariasAtual` do cotista é substituído pelo valor do seu `saldoDiariasFuturo` (que já contém os débitos de reservas feitas antecipadamente para o novo ano).
    2.  O `saldoDiariasFuturo` é então recalculado do zero, recebendo o valor integral ao qual o cotista tem direito com base no seu `numeroDeFracoes * diariasPorFracao`.

### 15.2. Geração de Despesas Recorrentes

* **Arquivo:** `src/jobs/createRecurringExpenses.job.ts`
* **Agendamento:** `0 2 * * *` (Às 02:00 da manhã, diariamente).
* **Fuso Horário:** `America/Sao_Paulo`
* **Descrição:** Este job automatiza o lançamento de despesas fixas.
    1.  Ele busca todas as despesas "modelo" (templates) que estão marcadas com `recorrente: true`.
    2.  Verifica a `frequencia` (ex: `MENSAL`, `ANUAL`) e o `diaRecorrencia` de cada template.
    3.  Se a data de hoje corresponder à regra, ele cria uma nova instância dessa despesa e chama o `createExpenseWithPayments` para gerar o rateio (os `PagamentoCotista`) para todos os membros.

### 15.3. Atualização de Despesas Vencidas

* **Arquivo:** `src/jobs/updateOverdueExpenses.job.ts`
* **Agendamento:** `0 1 * * *` (Às 01:00 da manhã, diariamente).
* **Fuso Horário:** `America/Sao_Paulo`
* **Descrição:** Este job é responsável por manter a integridade do módulo financeiro.
    1.  Ele busca todas as despesas que estão com status `PENDENTE` ou `PARCIALMENTE_PAGO` e cuja `dataVencimento` é anterior ao dia atual.
    2.  Atualiza o status de todas essas despesas para `ATRASADO` usando uma operação em massa (`prisma.despesa.updateMany`).
    3.  Dispara notificações "fire-and-forget" para as propriedades afetadas.








## 16. Documentação da API (Endpoints)

A API é versionada e todos os endpoints estão sob o prefixo `/api/v1`. Todas as rotas que manipulam dados são protegidas e requerem um Access Token JWT.

### 16.1. Auth

Controladores: `src/controllers/Auth/`
Rotas: `src/routes/auth.route.ts`

Rotas responsáveis pelo ciclo de vida da autenticação do usuário (registro, login, logout, renovação de sessão).

#### POST `/api/v1/auth/register`
**Descrição:** Registra um novo usuário na plataforma. Verifica duplicidade de e-mail e CPF, hasheia a senha (`bcrypt`) e, em caso de sucesso, gera e retorna tokens de acesso e refresh (autenticando o usuário automaticamente).
**Auth:** Nenhuma.
**Request Body (application/json):**
    {
      "email": "novo.usuario@qota.com",
      "password": "Password123!",
      "nomeCompleto": "Nome de Teste",
      "cpf": "12345678901",
      "telefone": "11987654321",
      "termosAceitos": true
    }
**Response 201 (application/json):**
    {
      "success": true,
      "message": "Novo usuário Nome de Teste criado com sucesso.",
      "data": {
        "accessToken": "ey...",
        "id": 1,
        "email": "novo.usuario@qota.com",
        "nomeCompleto": "Nome de Teste",
        "cpf": "12345678901",
        "telefone": "11987654321",
        "userPhoto": null
      }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "A senha deve ter pelo menos 6 caracteres." | Falha na validação do Zod (`registerSchema`). |
| 400 | "Você deve aceitar os Termos de Uso..." | `termosAceitos` é `false`. |
| 409 | "Este e-mail já está em uso por uma conta ativa." | Conflito de e-mail (`User.email`). |
| 409 | "Este CPF já está em uso por uma conta ativa." | Conflito de CPF (`User.cpf`). |

#### POST `/api/v1/auth/login`
**Descrição:** Autentica um usuário existente. Valida as credenciais (`bcrypt.compare`) e, se corretas, retorna um novo Access Token e um Refresh Token (via cookie `httpOnly`).
**Auth:** Nenhuma.
**Request Body (application/json):**
    {
      "email": "usuario.existente@qota.com",
      "password": "Password123!"
    }
**Response 200 (application/json):**
(Define o cookie `jwt=...; HttpOnly; Secure; SameSite=Lax`)
    {
      "success": true,
      "message": "Usuário Nome de Teste logado com sucesso.",
      "data": {
        "accessToken": "ey...",
        "id": 1,
        "email": "usuario.existente@qota.com",
        "userPhoto": { "url": "http://localhost:8001/uploads/..." }
      }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 401 | "E-mail ou senha inválidos." | Usuário não encontrado, senha incorreta, ou usuário `excludedAt != null`. |

#### POST `/api/v1/auth/logout`
**Descrição:** Encerra a sessão do usuário. Invalida o Refresh Token no banco de dados (`User.refreshToken = null`) e limpa o cookie `jwt` do cliente.
**Auth:** JWT (Access Token).
**Request Body:** Nenhuma.
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Logout realizado com sucesso."
    }

#### POST `/api/v1/auth/refresh`
**Descrição:** Renova a sessão do usuário. Utiliza o Refresh Token (enviado via cookie `jwt`) para gerar um novo Access Token de curta duração.
**Auth:** Nenhuma (usa cookie `jwt`).
**Request Body:** Nenhuma.
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Sessão restaurada com sucesso.",
      "data": {
        "accessToken": "ey... (novo)",
        "id": 1,
        "email": "usuario.existente@qota.com",
        "userPhoto": { "url": "http://localhost:8001/uploads/..." }
      }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 401 | "Acesso não autorizado. A sessão é inválida ou expirou." | Cookie `jwt` não foi enviado. |
| 403 | "Acesso proibido. O token de sessão não é mais válido." | Token expirado, inválido, ou não encontrado no DB (logout). |

### 16.2. User
Controladores: `src/controllers/User/`
Rotas: `src/routes/user.route.ts`

Rotas para gerenciamento de perfis de usuário.

#### GET `/api/v1/user/`
**Descrição:** (Admin) Lista todos os usuários da plataforma com paginação e busca.
**Auth:** JWT (Roles: `ROLES_LIST.Admin`).
**Query Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `limit` | `number` | Não | 10 | Quantidade de registros por página. |
| `page` | `number` | Não | 1 | Número da página. |
| `search` | `string` | Não | "teste" | Busca por e-mail, nome ou CPF. |
| `showDeleted`| `string` | Não | "false" | "false" (padrão), "true" (todos), "only" (só excluídos). |
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Usuários recuperados com sucesso.",
      "data": {
        "users": [ ... ],
        "pagination": { "page": 1, "limit": 10, "totalRecords": 1, "totalPages": 1 }
      }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 403 | "Acesso negado." | Usuário não é Admin. |

#### GET `/api/v1/user/:id`
**Descrição:** Busca os detalhes do perfil de um usuário específico.
**Auth:** JWT (Access Token).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | Sim | 1 | ID do usuário a ser buscado. |
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Usuário recuperado com sucesso.",
      "data": { "id": 1, "email": "...", "nomeCompleto": "...", "userPhoto": { ... } }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 403 | "Acesso negado. Você só pode visualizar seu próprio perfil." | `requesterId` não é igual ao `:id`. |
| 404 | "Usuário não encontrado." | ID não existe. |

#### PUT `/api/v1/user/:id`
**Descrição:** Atualiza os dados do perfil de um usuário. Permite envio de `multipart/form-data` para atualização da foto de perfil.
**Auth:** JWT (Access Token).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | Sim | 1 | ID do usuário a ser atualizado. |
**Request Body (multipart/form-data):**
(Campos opcionais)
    {
      "nomeCompleto": "Novo Nome de Teste",
      "telefone": "11999998888",
      "password": "NovaSenha123!",
      "fotoPerfil": (arquivo de imagem)
    }
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Usuário atualizado com sucesso.",
      "data": { "id": 1, "nomeCompleto": "Novo Nome de Teste", ... }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 403 | "Acesso negado. Você só pode editar seu próprio perfil." | `requesterId` não é igual ao `:id`. |
| 409 | "Este e-mail já está em uso." | Tentativa de mudar para um e-mail duplicado. |

#### DELETE `/api/v1/user/:id`
**Descrição:** Encerra e anonimiza a conta de um usuário. Realiza um *soft delete* (`excludedAt`) e sobrescreve os campos `email` e `cpf` com dados anonimizados (`deleted_{timestamp}_...`) para liberar as credenciais.
**Auth:** JWT (Access Token).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | Sim | 1 | ID do usuário a ser encerrado. |
**Response 200 (application/json):**
    {
      "success": true,
      "message": "A sua conta de usuário foi encerrada com sucesso."
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 403 | "Acesso negado. Você só pode encerrar sua própria conta." | `requesterId` não é igual ao `:id`. |
| 404 | "Usuário não encontrado ou já foi encerrado." | O usuário não existe ou já está `excludedAt`. |

### 16.3. Property
Controladores: `src/controllers/Property/`
Rotas: `src/routes/property.route.ts`

Rotas para o CRUD de propriedades.

#### POST `/api/v1/property/create`
**Descrição:** Cria uma nova propriedade. O usuário que cria é automaticamente definido como `proprietario_master`, recebendo 100% das frações (ex: 52), o saldo pro-rata para o ano atual e o saldo cheio para o ano futuro.
**Auth:** JWT (Access Token).
**Request Body (application/json):**
    {
      "nomePropriedade": "Casa de Praia",
      "tipo": "Casa",
      "totalFracoes": 52,
      "enderecoCep": "12345678",
      "enderecoCidade": "São Paulo",
      "valorEstimado": 500000
    }
**Response 201 (application/json):**
    {
      "success": true,
      "message": "Propriedade \"Casa de Praia\" criada com sucesso.",
      "data": { "id": 1, "nomePropriedade": "Casa de Praia", ... }
    }
**Notas:** A lógica de cálculo de saldo pro-rata é executada aqui.

#### GET `/api/v1/property/`
**Descrição:** Lista todas as propriedades do *usuário autenticado* com paginação e busca. Usado pelo front-end para o dashboard inicial, mas substituído em favor de `/permission/user/:id/properties`.
**Auth:** JWT (Access Token).
**Query Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `limit` | `number` | Não | 10 | Paginação. |
| `page` | `number` | Não | 1 | Paginação. |
| `search` | `string` | Não | "casa" | Busca por nome ou cidade. |
**Response 200 (application/json):**
    {
      "success": true,
      "data": {
        "properties": [
          { "id": 1, "nomePropriedade": "Casa de Praia", "permissao": "proprietario_master", ... }
        ],
        "pagination": { ... }
      }
    }

#### GET `/api/v1/property/:id`
**Descrição:** Busca os detalhes completos de uma propriedade específica, incluindo a lista de membros (`usuarios`), fotos e documentos.
**Auth:** JWT (Access Token) (Deve ser membro da propriedade).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | Sim | 1 | ID da propriedade. |
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Propriedade recuperada com sucesso.",
      "data": {
        "id": 1,
        "nomePropriedade": "Casa de Praia",
        "totalFracoes": 52,
        "diariasPorFracao": 7.019,
        "fotos": [ ... ],
        "documentos": [ ... ],
        "usuarios": [
          { "id": 101, "permissao": "proprietario_master", "numeroDeFracoes": 52, ... }
        ]
      }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 404 | "Propriedade não encontrada ou acesso negado." | ID não existe ou o usuário requisitante não é membro. |

#### PUT `/api/v1/property/:id`
**Descrição:** Atualiza os dados de uma propriedade. Apenas `proprietario_master`. Se `totalFracoes` for alterado, recalcula o saldo (atual pro-rata e futuro cheio) de todos os membros.
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | Sim | 1 | ID da propriedade. |
**Request Body (application/json):**
    {
      "nomePropriedade": "Casa de Praia (Atualizada)",
      "totalFracoes": 52
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "Acesso negado, a propriedade não foi encontrada..." | Usuário não é Master ou propriedade não existe. |
| 400 | "Não é possível definir o total de frações..." | `totalFracoes` é menor que o número de cotistas com frações. |

#### DELETE `/api/v1/property/:id`
**Descrição:** Realiza um *soft delete* de uma propriedade (define `excludedAt`). Apenas `proprietario_master`.
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | Sim | 1 | ID da propriedade. |
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 403 | "Acesso negado. Apenas proprietários master..." | Usuário não é Master. |
| 400 | "Esta propriedade já foi excluída anteriormente." | `excludedAt` já está definido. |

### 16.4. Permission
Controladores: `src/controllers/Permission/`
Rotas: `src/routes/permission.route.ts`

Rotas para gerenciar vínculos (permissões, frações) entre usuários e propriedades.

#### GET `/api/v1/permission/`
**Descrição:** (Admin) Lista todos os vínculos (`UsuariosPropriedades`) do sistema, com paginação.
**Auth:** JWT (Roles: `ROLES_LIST.Admin`).
**Query Params:** `limit`, `page`, `search`.

#### GET `/api/v1/permission/user/:id/properties`
**Descrição:** Rota principal da Home (Dashboard). Lista todas as propriedades (vínculos) de um usuário específico, incluindo sua permissão e saldos de diárias (atual e futuro) para cada uma.
**Auth:** JWT (Access Token).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | Sim | 1 | ID do usuário (`requesterId` deve ser o mesmo). |
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Propriedades do usuário recuperadas com sucesso.",
      "data": [
        {
          "id": 1,
          "nomePropriedade": "Casa de Praia",
          "tipo": "Casa",
          "imagemPrincipal": "/uploads/property/property-photo-123.jpg",
          "permissao": "proprietario_master",
          "numeroDeFracoes": 51,
          "saldoDiariasAtual": 360.0,
          "saldoDiariasFuturo": 358.0
        }
      ],
      "pagination": { ... }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 403 | "Acesso negado. Você só pode visualizar sua própria lista..." | `requesterId` não é igual ao `:id`. |

#### GET `/api/v1/permission/:id`
**Descrição:** Lista todos os membros (vínculos `UsuariosPropriedades`) de uma propriedade específica, com paginação e busca.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | Sim | 1 | ID da **Propriedade**. |
**Query Params:** `limit`, `page`, `search`.
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Membros da propriedade recuperados com sucesso.",
      "data": [
        {
          "idVinculo": 101,
          "idUsuario": 1,
          "nomeCompleto": "Master da Silva",
          "email": "master@qota.com",
          "permissao": "proprietario_master",
          "numeroDeFracoes": 51,
          "saldoDiariasAtual": 360.0
        }
      ],
      "pagination": { ... }
    }

#### PUT `/api/v1/permission/:id`
**Descrição:** Atualiza a permissão (role) de um membro. Apenas `proprietario_master`.
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | Sim | 102 | ID do **Vínculo** (`UsuariosPropriedades.id`). |
**Request Body (application/json):**
    {
      "permissao": "proprietario_master"
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 403 | "Acesso negado. Apenas proprietários master..." | Requisitante não é Master. |
| 400 | "Você não pode alterar sua própria permissão." | |
| 400 | "Ação bloqueada: Um usuário precisa ter pelo menos 1 fração..." | Tentativa de promover usuário com 0 frações. |
| 400 | "Ação bloqueada: Não é possível rebaixar o último..." | |

#### PUT `/api/v1/permission/cota/:vinculoId`
**Descrição:** Atualiza o `numeroDeFracoes` de um membro. Apenas `proprietario_master`. Recalcula e atualiza os saldos (Atual pro-rata, Futuro cheio) do membro alvo.
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `vinculoId`| `number` | Sim | 102 | ID do **Vínculo** (`UsuariosPropriedades.id`). |
**Request Body (application/json):**
    {
      "numeroDeFracoes": 5
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "Operação inválida. O número total de frações..." | Soma das frações ultrapassa o `totalFracoes` da propriedade. |

#### DELETE `/api/v1/permission/unlink/member/:vinculoId`
**Descrição:** (Master) Remove (desvincula) *outro* membro da propriedade. As frações e saldos (pro-rata e futuro) do membro removido são transferidos para o master que executou a ação.
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `vinculoId`| `number` | Sim | 102 | ID do **Vínculo** (`UsuariosPropriedades.id`) do membro a ser removido. |
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "Você não pode remover a si mesmo." | Master tentando se auto-remover por esta rota. |

#### DELETE `/api/v1/permission/unlink/me/:vinculoId`
**Descrição:** (Usuário) Permite que o usuário autenticado se desvincule (saia) de uma propriedade. As frações e saldos (pro-rata e futuro) são transferidos para o master mais antigo.
**Auth:** JWT (Access Token).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `vinculoId`| `number` | Sim | 102 | ID do **Vínculo** (`UsuariosPropriedades.id`) do próprio usuário. |
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "Acesso negado. Você só pode remover o seu próprio vínculo." | |
| 400 | "Ação bloqueada. Você é o único proprietário master." | Impede que o último master saia. |

### 16.5. Invite
Controladores: `src/controllers/Invite/`
Rotas: `src/routes/invite.route.ts`

Rotas para o fluxo de convite de novos membros.

#### POST `/api/v1/invite`
**Descrição:** (Master) Cria um novo convite (token) para um e-mail se juntar a uma propriedade.
**Auth:** JWT (Role: `proprietario_master`).
**Request Body (application/json):**
    {
      "emailConvidado": "novo.cotista@email.com",
      "idPropriedade": 1,
      "permissao": "proprietario_comum",
      "numeroDeFracoes": 1
    }
**Response 201 (application/json):**
    {
      "success": true,
      "message": "Convite criado com sucesso para novo.cotista@email.com.",
      "data": {
        "linkConvite": "http://localhost:3000/convite/a1b2c3d4e5f6..."
      }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "Não é possível criar este convite. ... frações livres" | Master tentando ceder mais frações do que possui. |
| 409 | "Este usuário já é membro da propriedade." | |

#### GET `/api/v1/invite/verify/:token`
**Descrição:** (Público) Verifica um token de convite. Usado pelo front-end para mostrar a tela correta (Registrar, Logar ou Aceitar).
**Auth:** Nenhuma.
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `token` | `string` | Sim | "a1b2c3d4e5f6..." | O token de convite. |
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Convite válido.",
      "data": {
        "propriedade": "Casa de Praia",
        "convidadoPor": "Master da Silva",
        "emailConvidado": "novo.cotista@email.com",
        "userExists": false,
        "numeroDeFracoes": 1
      }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 404 | "Convite inválido ou já utilizado." | Token não encontrado ou status != PENDENTE. |
| 410 | "Este convite expirou." | `dataExpiracao` ultrapassada. |

#### POST `/api/v1/invite/accept/:token`
**Descrição:** (Usuário) Aceita um convite. O usuário deve estar autenticado. O sistema cria o vínculo (`UsuariosPropriedades`), transfere as frações (do pool livre ou do master) e calcula os saldos pro-rata (atual) e cheio (futuro) para o novo membro.
**Auth:** JWT (Access Token).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `token` | `string` | Sim | "a1b2c3d4e5f6..." | O token de convite. |
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Convite aceito com sucesso! A propriedade agora faz parte da sua conta."
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "Convite inválido, expirado ou já utilizado." | |
| 400 | "Acesso negado: Este convite foi destinado a outro e-mail." | E-mail do usuário logado != e-mail do convite. |
| 409 | "Você já é um membro desta propriedade." | Vínculo já existe (erro P2002). |

#### GET `/api/v1/invite/property/:propertyId/pending`
**Descrição:** (Master) Lista os convites pendentes e não expirados de uma propriedade.
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `propertyId` | `number` | Sim | 1 | ID da Propriedade. |
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Convites pendentes recuperados com sucesso.",
      "data": [ ... ],
      "pagination": { ... }
    }

### 16.6. Calendar
Controladores: `src/controllers/Calendar/`
Rotas: `src/routes/calendar.route.ts`

Rotas para gerenciamento de reservas, check-in/out e regras.

#### POST `/api/v1/calendar/reservation`
**Descrição:** Cria uma nova reserva. Valida regras de negócio (duração min/max, limite de feriados) e debita o saldo de diárias do "pote" correto (Atual ou Futuro) de forma atômica.
**Auth:** JWT (Role: Membro da propriedade).
**Request Body (application/json):**
    {
      "idPropriedade": 1,
      "dataInicio": "2026-01-10T00:00:00.000Z",
      "dataFim": "2026-01-15T00:00:00.000Z",
      "numeroHospedes": 2
    }
**Response 201 (application/json):**
    {
      "success": true,
      "message": "Reserva criada com sucesso.",
      "data": { ... (objeto da nova Reserva) ... }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "Sua reserva de 5 dias para 2026 excede seu saldo de 0 dias..." | Saldo insuficiente no pote do ano da reserva. |
| 400 | "As datas selecionadas já estão ocupadas." | Conflito de datas (verificado na transação). |

#### GET `/api/v1/calendar/reservation/:reservationId`
**Descrição:** Busca os detalhes completos de uma reserva específica, incluindo checklists (check-in/out) e dados do usuário/propriedade.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `reservationId`| `number` | Sim | 1 | ID da Reserva. |
**Response 200 (application/json):**
    {
      "success": true,
      "data": { "id": 1, "status": "CONFIRMADA", "usuario": { ... }, "checklist": [ ... ] }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 404 | "Reserva não encontrada ou acesso negado." | ID não existe ou usuário não é membro. |

#### DELETE `/api/v1/calendar/reservation/:reservationId`
**Descrição:** Cancela uma reserva. Apenas o dono da reserva ou um `proprietario_master` pode cancelar. Devolve os dias ao "pote" de saldo correto (Atual ou Futuro). *Pode* criar uma `Penalidade` se o cancelamento for fora do prazo.
**Auth:** JWT (Role: Dono da reserva ou Master).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `reservationId`| `number` | Sim | 1 | ID da Reserva. |
**Response 200 (application/json):**
    { "success": true, "message": "Reserva cancelada com sucesso." }

#### POST `/api/v1/calendar/checkin`
**Descrição:** Realiza o check-in de uma reserva. Apenas o dono da reserva pode fazer. Salva o estado do inventário no momento da entrada.
**Auth:** JWT (Role: Dono da reserva).
**Request Body (application/json):**
    {
      "reservationId": 1,
      "observacoes": "Tudo ok na entrada.",
      "itens": [
        { "idItemInventario": 1, "estadoConservacao": "BOM", "observacao": "" },
        { "idItemInventario": 2, "estadoConservacao": "DESGASTADO", "observacao": "Arranhado" }
      ]
    }
**Response 201 (application/json):**
    {
      "success": true,
      "message": "Check-in realizado com sucesso!",
      "data": { ... (objeto do novo ChecklistInventario) ... }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "O check-in para esta reserva já foi realizado." | |

#### POST `/api/v1/calendar/checkout`
**Descrição:** Realiza o check-out de uma reserva. Apenas o dono. Salva o estado do inventário na saída e atualiza o status da reserva para `CONCLUIDA`.
**Auth:** JWT (Role: Dono da reserva).
**Request Body (application/json):**
    {
      "reservationId": 1,
      "observacoes": "Tudo ok na saída.",
      "itens": [
        { "idItemInventario": 1, "estadoConservacao": "BOM", "observacao": "" }
      ]
    }
**Response 201 (application/json):**
    { "success": true, "message": "Check-out realizado e reserva concluída com sucesso!" }

#### GET `/api/v1/calendar/property/:propertyId`
**Descrição:** Lista todas as reservas (não canceladas) de uma propriedade dentro de um intervalo de datas. Usado para popular o calendário principal.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `propertyId` | `number` | Sim | 1 | ID da Propriedade. |
**Query Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `startDate` | `string` | Sim | "2025-01-01T00:00:00Z" | Início do período da busca. |
| `endDate` | `string` | Sim | "2025-01-31T00:00:00Z" | Fim do período da busca. |
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Reservas recuperadas com sucesso.",
      "data": [ ... (lista de Reservas) ... ]
    }

#### PUT `/api/v1/calendar/rules/:propertyId`
**Descrição:** (Master) Atualiza as regras de agendamento de uma propriedade (duração min/max, prazo de cancelamento, etc.).
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:**
| Nome | Tipo | Obrigatório | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `propertyId` | `number` | Sim | 1 | ID da Propriedade. |
**Request Body (application/json):**
    {
      "duracaoMinimaEstadia": 2,
      "duracaoMaximaEstadia": 10,
      "prazoCancelamentoReserva": 30
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "A duração máxima da estadia não pode ser menor..." | Conflito de regras. |

#### GET `/api/v1/calendar/property/:propertyId/upcoming`
**Descrição:** (Membro) Lista as próximas reservas ativas de uma propriedade.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `propertyId`.
**Query Params:** `limit`, `page`.

#### GET `/api/v1/calendar/property/:propertyId/completed`
**Descrição:** (Membro) Lista o histórico de reservas concluídas de uma propriedade.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `propertyId`.
**Query Params:** `limit`, `page`.

#### GET `/api/v1/calendar/property/:propertyId/penalties`
**Descrição:** (Membro) Lista as penalidades ativas (`dataFim >= today`) de uma propriedade.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `propertyId`.
**Query Params:** `limit`, `page`.

### 16.7. Financial
Controladores: `src/controllers/Financial/`
Rotas: `src/routes/financial.route.ts`

Rotas para o módulo financeiro.

#### POST `/api/v1/financial/ocr-process`
**Descrição:** Rota "Gateway" que recebe um arquivo, envia para o serviço externo de OCR (Python/Flask) e retorna os dados extraídos.
**Auth:** JWT (Access Token).
**Request Body (multipart/form-data):** `invoiceFile` (arquivo).
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Dados extraídos com sucesso.",
      "data": { "valor_total": "150.75", "data_vencimento": "2025-10-30", "categoria": "Energia" }
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 502 | "O serviço de validação... está indisponível." | Erro de conexão com a API de OCR. |

#### POST `/api/v1/financial/expense/manual`
**Descrição:** (Membro) Cria uma nova despesa. Chama o `expense.service` para criar a `Despesa` e realizar o rateio (criar `PagamentoCotista`) atomicamente.
**Auth:** JWT (Role: Membro da propriedade).
**Request Body (multipart/form-data):**
Campos: `idPropriedade`, `descricao`, `valor`, `dataVencimento`, `categoria`, `recorrente` (`"true"`/`"false"`), `comprovanteFile` (array de arquivos).
**Response 201 (application/json):**
    { "success": true, "message": "Despesa registrada e dividida...", "data": { ... } }

#### GET `/api/v1/financial/expense/:expenseId`
**Descrição:** (Membro) Busca detalhes de uma despesa, incluindo a lista de todos os `pagamentos` (rateios) e seus status.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `expenseId`.
**Response 200 (application/json):**
    {
      "success": true,
      "data": {
        "id": 1,
        "descricao": "Conta de Luz",
        "valor": 150.75,
        "status": "PENDENTE",
        "pagamentos": [
          { "id": 1, "idCotista": 1, "valorDevido": 75.38, "pago": false, "cotista": { ... } },
          { "id": 2, "idCotista": 2, "valorDevido": 75.37, "pago": false, "cotista": { ... } }
        ],
        "currentUserIsMaster": true
      }
    }

#### PUT `/api/v1/financial/expense/:expenseId`
**Descrição:** (Autor ou Master) Atualiza uma despesa. Se o `valor` for alterado, o rateio (`PagamentoCotista`) é recalculado para todos os membros.
**Auth:** JWT (Role: Autor da despesa ou Master).
**Path Params:** `expenseId`.
**Request Body (multipart/form-data):** Campos de `create.Expense` + `comprovanteFile`.
**Notas:** Remove arquivos de comprovante antigos do `FileSys` se novos forem enviados.

#### PUT `/api/v1/financial/expense/:expenseId/mark-all-paid`
**Descrição:** (Master) Ação em massa para marcar uma despesa e todos os seus rateios como `PAGO`.
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:** `expenseId`.
**Response 200 (application/json):**
    { "success": true, "message": "Todos os pagamentos foram marcados como pagos...", "data": { ... } }

#### DELETE `/api/v1/financial/expense/:expenseId`
**Descrição:** (Master) Cancela uma despesa. Define o status como `CANCELADO`.
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:** `expenseId`.
**Response 200 (application/json):**
    { "success": true, "message": "Despesa cancelada com sucesso.", "data": { ... } }

#### PUT `/api/v1/financial/payment/:paymentId`
**Descrição:** (Dono do Pagamento ou Master) Atualiza o status de um pagamento individual (ex: marca como `pago: true`). Recalcula o status agregado da `Despesa` pai.
**Auth:** JWT (Role: Dono do `PagamentoCotista` ou Master).
**Path Params:** `paymentId`.
**Request Body (application/json):**
    {
      "pago": true
    }
**Response 200 (application/json):**
    { "success": true, "message": "Status do pagamento atualizado com sucesso.", "data": { ... } }
**Notas:** A lógica recalcula o status da `Despesa` (PENDENTE, PARCIALMENTE_PAGO, PAGO) dentro da mesma transação.

#### GET `/api/v1/financial/property/:propertyId/summary`
**Descrição:** Retorna dados agregados para o dashboard financeiro, com base em um período de datas.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `propertyId`.
**Query Params:** `startDate`, `endDate`.
**Response 200 (application/json):**
    {
      "success": true,
      "data": {
        "totalSpent": 150.75,
        "projectedSpending": 50.0,
        "topCategory": "Energia",
        "chartData": [
          { "name": "Energia", "valor": 150.75 },
          { "name": "Água", "valor": 50.0 }
        ]
      }
    }

#### GET `/api/v1/financial/property/:propertyId/report`
**Descrição:** Gera e retorna um relatório financeiro em formato PDF usando `Puppeteer`.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `propertyId`.
**Query Params:** `startDate`, `endDate`.
**Response:** `application/pdf` (Buffer de dados do arquivo PDF).

#### GET `/api/v1/financial/property/:propertyId`
**Descrição:** (Membro) Lista todas as despesas de uma propriedade com paginação e filtros.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `propertyId`.
**Query Params:** `limit`, `page`, `status`, `categoria`, `startDate`, `endDate`.
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Despesas recuperadas com sucesso.",
      "data": { "despesas": [ ... ], "pagination": { ... } }
    }

### 16.8. Inventory
Controladores: `src/controllers/Inventory/`
Rotas: `src/routes/inventory.route.ts`

Rotas para o CRUD de itens de inventário.

#### POST `/api/v1/inventory/create`
**Descrição:** (Membro) Cria um novo item de inventário para uma propriedade.
**Auth:** JWT (Role: Membro da propriedade).
**Request Body (application/json):**
    {
      "idPropriedade": 1,
      "nome": "Cadeira de Praia",
      "quantidade": 4,
      "estadoConservacao": "BOM",
      "categoria": "Móveis"
    }

#### GET `/api/v1/inventory/property/:propertyId`
**Descrição:** (Membro) Lista os itens de inventário de uma propriedade com paginação.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `propertyId`.
**Query Params:** `limit`, `page`.

#### GET `/api/v1/inventory/:id`
**Descrição:** (Membro) Busca os detalhes de um item de inventário específico.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `id` (ID do item).

#### PUT `/api/v1/inventory/:id`
**Descrição:** (Master) Atualiza um item de inventário.
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:** `id` (ID do item).
**Request Body (application/json):**
    {
      "nome": "Cadeira de Praia (Nova)",
      "quantidade": 5,
      "estadoConservacao": "DESGASTADO"
    }

#### DELETE `/api/v1/inventory/:id`
**Descrição:** (Master) Realiza um *soft delete* de um item de inventário (define `excludedAt`).
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:** `id` (ID do item).

### 16.9. Inventory Photo
Controladores: `src/controllers/InventoryPhoto/`
Rotas: `src/routes/inventoryPhoto.route.ts`

#### POST `/api/v1/inventoryPhoto/upload`
**Descrição:** (Membro) Faz upload de uma foto para um item de inventário. Limite de 6 fotos por item.
**Auth:** JWT (Role: Membro da propriedade).
**Request Body (multipart/form-data):**
    {
      "idItemInventario": 1,
      "photo": (arquivo de imagem)
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "Limite de 6 fotos por item atingido." | |

#### DELETE `/api/v1/inventoryPhoto/:id`
**Descrição:** (Master) Realiza um *soft delete* de uma foto de inventário (define `excludedAt`).
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:** `id` (ID da foto).

### 16.10. Property Photo
Controladores: `src/controllers/PropertyPhoto/`
Rotas: `src/routes/propertyPhoto.route.ts`

Rotas para fotos da galeria principal da propriedade.

#### POST `/api/v1/propertyPhoto/upload`
**Descrição:** (Master) Faz upload de uma foto para a galeria da propriedade.
**Auth:** JWT (Role: `proprietario_master`).
**Request Body (multipart/form-data):**
    {
      "idPropriedade": 1,
      "foto": (arquivo de imagem)
    }

#### GET `/api/v1/propertyPhoto/:id`
**Descrição:** (Membro) Busca uma foto específica pelo seu ID.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `id` (ID da foto).

#### DELETE `/api/v1/propertyPhoto/:id`
**Descrição:** (Master) Exclui permanentemente uma foto da propriedade (exclui o arquivo físico `fs.unlink` e o registro no DB).
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:** `id` (ID da foto).

*(Rota GET / e DELETE / de Admin omitidas)*

### 16.11. Property Documents
Controladores: `src/controllers/PropertyDocuments/`
Rotas: `src/routes/propertyDocuments.route.ts`

Rotas para documentos da propriedade (ex: escritura).

#### POST `/api/v1/propertyDocuments/upload`
**Descrição:** (Master) Faz upload de um documento (PDF/Imagem) para uma propriedade.
**Auth:** JWT (Role: `proprietario_master`).
**Request Body (multipart/form-data):**
    {
      "idPropriedade": 1,
      "tipoDocumento": "Escritura",
      "documento": (arquivo PDF/imagem)
    }

#### GET `/api/v1/propertyDocuments/:id`
**Descrição:** (Membro) Busca um documento específico pelo seu ID.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `id` (ID do documento).

#### DELETE `/api/v1/propertyDocuments/:id`
**Descrição:** (Master) Exclui permanentemente um documento da propriedade (exclui o arquivo físico `fs.unlink` e o registro no DB).
**Auth:** JWT (Role: `proprietario_master`).
**Path Params:** `id` (ID do documento).

*(Rota GET / de Admin omitida)*

### 16.12. Notification
Controladores: `src/controllers/Notification/`
Rotas: `src/routes/notification.route.ts`

#### GET `/api/v1/notification/property/:propertyId`
**Descrição:** (Membro) Lista as notificações de uma propriedade, com paginação.
**Auth:** JWT (Role: Membro da propriedade).
**Path Params:** `propertyId`.
**Query Params:** `limit`, `page`.
**Response 200 (application/json):**
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "mensagem": "O usuário 'Master da Silva' adicionou uma nova foto...",
          "createdAt": "2025-10-20T10:00:00.000Z",
          "autor": { "id": 1, "nomeCompleto": "Master da Silva" },
          "lidaPor": [ { "id": 1 }, { "id": 2 } ]
        }
      ],
      "pagination": { ... }
    }

#### PUT `/api/v1/notification/read`
**Descrição:** (Usuário) Marca um array de notificações como lidas para o usuário autenticado.
**Auth:** JWT (Access Token).
**Request Body (application/json):**
    {
      "notificationIds": [1, 2, 3]
    }
**Response 200 (application/json):**
    {
      "success": true,
      "message": "Notificações marcadas como lidas com sucesso."
    }

### 16.13. Validation
Controladores: `src/controllers/Validation/`
Rotas: `src/routes/validation.route.ts`

#### POST `/api/v1/validation/address`
**Descrição:** (Usuário) Rota "Gateway" que recebe um PDF de comprovante de endereço e dados de texto, envia ao serviço de OCR (Python/Flask) para análise e retorna o resultado da validação.
**Auth:** JWT (Access Token).
**Request Body (multipart/form-data):**
    {
      "documento": (arquivo PDF),
      "address": "Rua Principal, 100",
      "cep": "12345678"
    }
**Response 200 (application/json):**
    {
      "success": true,
      "message": "O documento valida o endereço fornecido."
    }
**Erros comuns:**
| Código | Mensagem | Causa / Observações |
| :--- | :--- | :--- |
| 400 | "Formato de arquivo inválido. Apenas PDFs..." | `multer` rejeitou o arquivo. |
| 502 | "O serviço de validação de documentos está indisponível." | Erro de conexão com a API de OCR. |
| 400 | "O endereço não pôde ser validado..." | Resposta do serviço de OCR indicando falha na validação. |





## 17. Contribuindo

Agradecemos o interesse em contribuir para o QOTA! Para garantir a qualidade e a consistência do código, pedimos que siga as diretrizes abaixo.

### 17.1. Padrão de Commits

O projeto utiliza o padrão **Conventional Commits**. Isso é essencial para manter o histórico do Git limpo e futuramente automatizar a geração de changelogs.

**Formato:** `<tipo>(<escopo>): <descrição curta>`

* **Tipos Comuns:**
    * `feat`: Uma nova funcionalidade (ex: `feat(financial): Adiciona rota de relatório PDF`).
    * `fix`: Uma correção de bug (ex: `fix(calendar): Corrige débito de saldo pro-rata`).
    * `docs`: Alterações apenas na documentação (ex: `docs(readme): Atualiza seção de API`).
    * `style`: Mudanças de formatação, lint, etc. (sem alteração lógica).
    * `refactor`: Refatoração de código sem mudança de funcionalidade.
    * `test`: Adição ou correção de testes.
    * `chore`: Manutenção de build, scripts, CI/CD, etc.

* **Exemplo de Commit:**
    ```bash
    git commit -m "fix(permission): Bloqueia promoção de cotista com 0 frações a master" -m "Adiciona validação no update.Permission.controller para impedir que um usuário com numeroDeFracoes=0 seja definido como 'proprietario_master'."
    ```

### 17.2. Fluxo de Trabalho (Branching Model)

Utilizamos um fluxo baseado em *feature branches*. A branch `main` é protegida e contém o código de produção estável.

1.  **Crie uma Nova Branch:** A partir da `main`, crie uma branch descritiva.
    ```bash
    # Exemplo:
    git checkout -b feature/login-google-sso
    git checkout -b fix/bug-calculo-saldo-futuro
    ```

2.  **Desenvolva e Commite:** Faça suas alterações e commite usando o padrão convencional.

3.  **Execute os Testes Localmente:** Antes de enviar, garanta que todos os testes estão passando.
    ```bash
    npm test
    ```

4.  **Faça o Push:** Envie sua branch para o repositório remoto.
    ```bash
    git push origin feature/login-google-sso
    ```

5.  **Abra um Pull Request (PR):** Abra um PR da sua *feature branch* para a branch `main`. Descreva o que foi feito e por quê.

6.  **Revisão de Código:** O PR será revisado pela equipe. A pipeline de CI do GitHub Actions deve passar com sucesso antes do *merge*.



## 18. Licença

Todos os direitos autorais são reservados pelo QOTA.