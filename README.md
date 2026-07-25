# WPP Sync

Aplicação para gerenciamento colaborativo de conversas do WhatsApp. Cada workspace possui uma instância independente do WhatsApp Web, permitindo que vários usuários compartilhem o mesmo atendimento simultaneamente.

> [!WARNING]
> Este projeto está em fase inicial de desenvolvimento. Funcionalidades, estrutura, contratos da API e instruções de implantação ainda podem mudar sem aviso. Não é recomendado utilizá-lo em produção neste momento.

## Tecnologias

- React, Vite e Tailwind CSS no client
- Fastify no server
- Prisma e PostgreSQL no banco de dados
- TypeScript
- pnpm workspaces e Turborepo
- dotenvx para carregar variáveis de ambiente
- Docker Compose para o PostgreSQL local

## Requisitos

Antes de começar, instale:

- Node.js 22 ou superior
- pnpm 11
- Docker com Docker Compose

## Configuração local

1. Clone o repositório e acesse a pasta do projeto:

```bash
git clone https://github.com/ImString/wpp-sync
cd wpp-sync
```

2. Instale as dependências:

```bash
pnpm install
```

3. Crie os arquivos de ambiente a partir do exemplo:

```bash
cp .env.example .env
cp .env.example .env.development
```

No PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item .env.example .env.development
```

Revise os valores antes de continuar, principalmente as credenciais do PostgreSQL e as portas das aplicações. Os arquivos `.env` não devem ser enviados para o Git.

4. Inicie o PostgreSQL:

```bash
docker compose up -d postgres
```

5. Gere o Prisma Client e sincronize o schema de desenvolvimento:

```bash
pnpm db:generate
pnpm db:push:dev
```

6. Inicie o projeto:

```bash
pnpm dev
```

Por padrão, os serviços ficam disponíveis em:

- Client: [http://localhost:3005](http://localhost:3005)
- Server: [http://localhost:3001](http://localhost:3001)

Também é possível iniciar cada aplicação separadamente:

```bash
pnpm dev:client
pnpm dev:server
```

## Comandos disponíveis

| Comando              | Descrição                                       |
| -------------------- | ----------------------------------------------- |
| `pnpm dev`           | Inicia as aplicações em modo de desenvolvimento |
| `pnpm dev:client`    | Inicia somente o client                         |
| `pnpm dev:server`    | Inicia somente o server                         |
| `pnpm build`         | Gera o build de produção do monorepo            |
| `pnpm start`         | Inicia os artefatos de produção após o build    |
| `pnpm db:generate`   | Gera o Prisma Client                            |
| `pnpm db:push:dev`   | Sincroniza o schema usando `.env.development`   |
| `pnpm db:push`       | Sincroniza o schema usando `.env`               |
| `pnpm db:studio:dev` | Abre o Prisma Studio em desenvolvimento         |
| `pnpm db:studio`     | Abre o Prisma Studio usando o ambiente padrão   |

## Build de produção

Configure o arquivo `.env` com os valores do ambiente de produção e execute:

```bash
pnpm install --frozen-lockfile
pnpm build
```

Os principais artefatos serão gerados em:

```text
apps/client/dist/       Aplicação web estática
apps/server/dist/       Server compilado
packages/database/dist/ Prisma Client compilado
packages/shared/dist/   Pacote compartilhado compilado
```

Para testar o build localmente:

```bash
pnpm start
```

## Hospedagem

### Client

O conteúdo de `apps/client/dist` pode ser publicado em qualquer hospedagem de arquivos estáticos, CDN ou servidor web. Configure o fallback para `index.html` quando forem adicionadas rotas no lado do client.

### Server

O server precisa de Node.js, das dependências do workspace e das variáveis presentes no `.env`. Após instalar e buildar o monorepo, execute:

```bash
pnpm --filter @wppsync/server start
```

### Banco de dados

Utilize uma instância PostgreSQL acessível pelo server e configure `DATABASE_URL`. Antes de uma implantação real, recomenda-se adotar migrations versionadas do Prisma no lugar de depender somente de `prisma db push`.

## Licença

Este projeto está configurado sob a licença MIT.
