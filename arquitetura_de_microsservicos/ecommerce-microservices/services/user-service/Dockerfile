# Build from monorepo root: docker build -f services/user-service/Dockerfile .
# ────────────────────────────────────────────────────────────
# Stage 1: Instalar dependências (com build tools para módulos nativos)
# ────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# python3 + make + g++ necessários para compilar bcrypt e outros módulos nativos
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
COPY shared/events/package.json ./shared/events/
COPY shared/common/package.json ./shared/common/
COPY services/user-service/package.json ./services/user-service/

RUN npm install

# ────────────────────────────────────────────────────────────
# Stage 2: Build dos pacotes compartilhados e do serviço
# ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY shared ./shared
COPY services/user-service ./services/user-service

RUN cd shared/common && npx tsc --skipLibCheck
RUN cd shared/events && npx tsc --skipLibCheck || true
RUN cd services/user-service && npx nest build

# ────────────────────────────────────────────────────────────
# Stage 3: Imagem de produção (mínima e sem root)
# ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/services/user-service/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/services/user-service/package.json ./
COPY --from=deps    --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/shared ./shared

USER appuser

ENV NODE_ENV=production
EXPOSE 3000

# Graceful shutdown: Node propaga SIGTERM corretamente
CMD ["node", "dist/main.js"]
