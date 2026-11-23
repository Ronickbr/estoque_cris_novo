# Multi-stage Dockerfile for Estoque Cris Monorepo
# Stage 1: Base dependencies
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Stage 2: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prefer-offline

# Stage 3: Build shared package
FROM base AS shared-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN pnpm run build

# Stage 4: Build backend
FROM base AS backend-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY apps/backend ./apps/backend
WORKDIR /app/apps/backend
RUN pnpm run build

# Stage 5: Build frontend
FROM base AS frontend-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend
RUN pnpm run build

# Stage 6: Production runner - Backend
FROM node:20-alpine AS backend-runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY --from=backend-builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=backend-builder --chown=nestjs:nodejs /app/apps/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=nestjs:nodejs /app/apps/backend/package.json ./package.json
USER nestjs
EXPOSE 5000
ENV PORT=5000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# Stage 7: Production runner - Frontend (Nginx)
FROM nginx:alpine AS frontend-runner
COPY --from=frontend-builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Stage 8: Combined production image (optional - for single container deployment)
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init nginx
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY --from=backend-builder --chown=nestjs:nodejs /app/apps/backend/dist ./backend/dist
COPY --from=backend-builder --chown=nestjs:nodejs /app/apps/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=nestjs:nodejs /app/apps/backend/package.json ./backend/package.json
COPY --from=frontend-builder /app/apps/frontend/dist ./frontend/dist
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 80 5000
ENTRYPOINT ["dumb-init", "--", "docker-entrypoint.sh"]