#### Configuração do Backend (Node.js)

Em um **novo terminal**, navegue até a pasta raiz do projeto novamente.

```bash

# Navegue até a pasta do backend
cd TCC-Back-main

# Instale as dependências
npm install

# Crie o arquivo .env na raiz de 'TCC-Back-main' e copie o conteúdo abaixo,
# ajustando as chaves secretas se desejar.
```

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

**Continue os comandos no terminal do backend:**

```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações para criar o banco de dados
npx prisma migrate dev

# Inicie o servidor de desenvolvimento (deixe este terminal aberto)
npm run dev
```

> **Nota:** O servidor do Backend irá rodar na porta `8001`.
