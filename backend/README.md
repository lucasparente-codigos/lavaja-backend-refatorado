# LavaJá Backend

Este repositório contém o código-fonte do backend para o sistema **LavaJá**, uma aplicação projetada para gerenciar o uso e a fila de máquinas de lavar e secar em um ambiente de lavanderia.

O projeto foi desenvolvido utilizando **Node.js** com **TypeScript** e o framework **Express**.

## ⚙️ Tecnologias Utilizadas

| Categoria | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Linguagem** | TypeScript | Superset tipado de JavaScript para maior robustez. |
| **Framework** | Express | Framework web minimalista e flexível para Node.js. |
| **Banco de Dados** | SQLite com `sqlite` e `sqlite3` | Banco de dados leve e sem servidor para persistência de dados. **(Nota: O código utiliza SQL nativo e não um ORM como Prisma, conforme documentação anterior)**. |
| **Tempo Real** | Socket.IO | Comunicação bidirecional e em tempo real para atualizações de status de máquinas e filas. |
| **Segurança** | JWT, bcryptjs, Helmet, express-rate-limit | Autenticação baseada em tokens, hash de senhas, e middlewares de segurança. |
| **Validação** | Joi | Validação robusta de esquemas de dados de entrada. |
| **Tarefas** | `backgroundJobs.ts` | Módulo para tarefas agendadas, como o monitoramento do tempo de uso das máquinas. |

## 💡 Funcionalidades Principais

O backend implementa uma API RESTful completa, além de comunicação em tempo real via WebSockets, para gerenciar os seguintes aspectos:

1.  **Autenticação e Autorização:**
    *   Registro e Login de **Usuários** (clientes da lavanderia).
    *   Registro e Login de **Empresas** (administradores da lavanderia).
    *   Proteção de rotas com **JSON Web Tokens (JWT)**.

2.  **Gestão de Máquinas:**
    *   Criação, listagem e atualização de **Máquinas** (lavadoras e secadoras).
    *   Controle de status da máquina (`disponivel`, `em_uso`, `manutencao`).

3.  **Sistema de Uso e Fila:**
    *   **Início e Fim de Uso:** Registro do tempo de uso das máquinas.
    *   **Fila de Espera:** Usuários podem entrar em uma fila para uma máquina específica.
    *   **Notificações em Tempo Real:** Atualizações de status da máquina e da posição na fila via **Socket.IO**.
    *   **Jobs em Background:** Monitoramento automático do tempo de uso para liberar máquinas quando o tempo estimado termina.

## 🛠️ Estrutura do Projeto

O código está organizado em módulos claros:

| Diretório | Descrição |
| :--- | :--- |
| `src/controllers` | Lógica de negócio para cada recurso (Usuário, Máquina, Fila, etc.). |
| `src/models` | Funções de acesso e manipulação de dados para cada tabela do SQLite. |
| `src/routes` | Definição das rotas da API e seus respectivos controladores. |
| `src/middleware` | Middlewares de segurança, autenticação e tratamento de erros. |
| `src/services` | Lógica de serviço, incluindo `backgroundJobs` e `machineStatusService`. |
| `src/utils` | Funções utilitárias (validação, resposta padronizada, hash de senha). |
| `src/database.ts` | Configuração da conexão com o SQLite e definição do esquema do banco de dados. |
| `src/socket.ts` | Configuração e lógica de transmissão de eventos via Socket.IO. |

## 🚀 Configuração e Execução

### Pré-requisitos

*   Node.js (versão 18+)
*   Yarn ou npm

### 1. Instalar Dependências

```bash
cd backend
yarn install
# ou npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do diretório `backend` com as seguintes variáveis:

```env
# URL de conexão com o banco de dados SQLite
# O arquivo dev.db será criado automaticamente no diretório 'data'
DATABASE_URL="file:./data/dev.db"

# Chave secreta para assinatura dos JWTs
JWT_SECRET="sua_chave_secreta_aqui"

# Ambiente de execução (development, production)
NODE_ENV="development"

# Porta de execução do servidor
PORT=4000

# URL do frontend para configuração do CORS e Socket.IO
FRONTEND_URL="http://localhost:5173"
```

### 3. Executar o Servidor

```bash
# Executa o servidor em modo de desenvolvimento com ts-node-dev
yarn dev
# ou npm run dev
```

O servidor estará acessível em `http://localhost:4000`.

## 📊 Endpoints da API

Abaixo estão alguns dos principais grupos de rotas disponíveis:

| Prefixo da Rota | Descrição |
| :--- | :--- |
| `/api/auth` | Login e autenticação. |
| `/api/users` | Registro e gestão de usuários (clientes). |
| `/api/companies` | Registro e gestão de empresas (administradores). |
| `/api/machines` | Gestão de máquinas (CRUD). |
| `/api/usage` | Início e fim de uso das máquinas. |
| `/api/queue` | Gerenciamento da fila de espera. |
| `/api/public` | Rotas públicas, como listagem de máquinas disponíveis. |
