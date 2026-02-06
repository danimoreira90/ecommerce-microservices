# Build from monorepo root: docker build -f services/user-service/Dockerfile .
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/events/package.json ./shared/events/
COPY shared/common/package.json ./shared/common/
COPY services/user-service/package.json ./services/user-service/
COPY shared ./shared
COPY services/user-service ./services/user-service
RUN npm install
RUN npm run build --workspace=@ecommerce/events --workspace=@ecommerce/common 2>/dev/null || true
RUN cd services/user-service && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/services/user-service/dist ./dist
COPY --from=builder /app/services/user-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
