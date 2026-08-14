FROM node:22-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable
WORKDIR /workspace

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/config/package.json packages/config/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/backend/package.json packages/backend/package.json
COPY packages/whatsapp-contracts/package.json packages/whatsapp-contracts/package.json
COPY apps/whatsapp-instance/package.json apps/whatsapp-instance/package.json

RUN pnpm install --frozen-lockfile --filter @wppsync/whatsapp-instance...

FROM dependencies AS build

COPY packages/config packages/config
COPY packages/shared packages/shared
COPY packages/backend packages/backend
COPY packages/whatsapp-contracts packages/whatsapp-contracts
COPY apps/whatsapp-instance apps/whatsapp-instance

RUN pnpm --filter @wppsync/shared build \
	&& pnpm --filter @wppsync/backend build \
	&& pnpm --filter @wppsync/whatsapp-contracts build \
	&& pnpm --filter @wppsync/whatsapp-instance build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV WHATSAPP_INSTANCE_RUNTIME=docker
ENV HOST=0.0.0.0
ENV PORT=3000
ENV WHATSAPP_DATA_DIR=/app/data

WORKDIR /workspace

COPY --from=build --chown=node:node /workspace/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/apps/whatsapp-instance ./apps/whatsapp-instance
COPY --from=build --chown=node:node /workspace/packages/backend ./packages/backend
COPY --from=build --chown=node:node /workspace/packages/shared ./packages/shared
COPY --from=build --chown=node:node /workspace/packages/whatsapp-contracts ./packages/whatsapp-contracts

RUN mkdir -p /app/data && chown -R node:node /app/data

USER node

EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget -qO- http://127.0.0.1:3000/health >/dev/null || exit 1

CMD ["node", "apps/whatsapp-instance/dist/core/index.js"]
