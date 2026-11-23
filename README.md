# Estoque Cris - Monorepo

Monorepo unificado para o sistema de controle de estoque Estoque Cris, contendo:

- **Backend**: NestJS + TypeORM + Neon PostgreSQL + Neon Auth (deploy: Neon Functions)
- **Frontend**: React 19 + TypeScript + Vite + React Bootstrap + TanStack Query (deploy: **Vercel**)
- **Shared**: Tipos, utilitários e configurações compartilhadas

## Estrutura

```
monorepo/
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── vercel.json   # (não usado - backend no Neon Functions)
│   │   └── ...
│   └── frontend/         # React + Vite
│       ├── vercel.json   # Configuração Vercel (SPA, headers, rewrites)
│       ├── .vercelignore # Arquivos ignorados no deploy Vercel
│       └── ...
├── packages/
│   └── shared/           # Tipos, utils, auth compartilhados
├── .github/workflows/    # CI/CD GitHub Actions
│   └── ci.yml           # Lint, test, build, deploy Vercel + Neon Functions
├── turbo.json           # Turborepo config
├── pnpm-workspace.yaml  # PNPM workspaces
├── Makefile             # Comandos úteis
├── package.json         # Root package.json
└── .env.example         # Variáveis de ambiente (template)
```

## Pré-requisitos

- Node.js 20+
- PNPM 9+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- Neon CLI (`npm i -g neon@latest`)
- **Vercel CLI** (`npm i -g vercel@latest`) - para deploy do frontend

## Instalação

```bash
# Instalar dependências
pnpm install
```

## Desenvolvimento

### Local (sem Docker)

```bash
# Configure variáveis no .env (copie de .env.example)
cp .env.example .env

# Terminal 1 - Backend (porta 5000)
cd apps/backend && pnpm run start:dev

# Terminal 2 - Frontend (porta 3000)
cd apps/frontend && pnpm run dev
```

### Comandos úteis (Makefile)

```bash
# Build tudo
make build

# Testes
make test

# Lint
make lint

# Format
make format

# Ver todos comandos
make help
```

## Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### Backend (Neon Functions)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL (Neon) | ✅ |
| `NEON_AUTH_BASE_URL` | URL base do Neon Auth | ✅ |
| `NEON_AUTH_JWKS_URL` | URL do JWKS do Neon Auth | ✅ |
| `NEON_AUTH_AUDIENCE` | Audience (default: neondb) | ✅ |
| `NEON_AUTH_ISSUER` | Issuer URL | ✅ |
| `AWS_ENDPOINT_URL_S3` | Endpoint Neon Object Storage | ✅ |
| `AWS_ACCESS_KEY_ID` | Access key Object Storage | ✅ |
| `AWS_SECRET_ACCESS_KEY` | Secret key Object Storage | ✅ |
| `REDIS_URL` | Redis connection string | Opcional |

### Frontend (Vercel) - Prefixo `VITE_`

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `VITE_API_URL` | URL da API backend (ex: `https://api.estoque-cris.com/api/v1`) | ✅ |
| `VITE_NEON_AUTH_BASE_URL` | URL base do Neon Auth para redirects de login | ✅ |

> **No Vercel**: Configure em Project Settings > Environment Variables (não no `.env`)

## Neon Setup (Backend)

```bash
# Login no Neon (ou use API Key)
neon login

# Ou configure API Key
echo "sua_api_key" | neon profile create DEFAULT --api-key -

# Deploy da infraestrutura (Postgres, Auth, Storage, Functions)
neon deploy

# Desenvolvimento local com Neon Functions
neon dev
```

## Build para Produção

```bash
# Build individual
cd apps/backend && pnpm run build
cd apps/frontend && pnpm run build

# Build completo (via Turborepo)
pnpm run build
```

## Deploy

### Frontend → Vercel (Automático via GitHub Actions)

**Configuração única (primeira vez):**

1. **Criar projeto no Vercel:**
   ```bash
   cd apps/frontend
   vercel login
   vercel --prod
   # Selecione "Link to existing project" ou crie novo
   ```

2. **Configurar variáveis no Vercel Dashboard:**
   - Project Settings > Environment Variables
   - Adicione: `VITE_API_URL`, `VITE_NEON_AUTH_BASE_URL`
   - Target: Production, Preview, Development

3. **Configurar GitHub Actions Secrets:**
   - Repository Settings > Secrets > Actions
   - `VERCEL_TOKEN` (Vercel Account Settings > Tokens)
   - `VERCEL_ORG_ID` (Project Settings > General)
   - `VERCEL_PROJECT_ID` (Project Settings > General)

**Deploy automático:**
- **Pull Requests**: Preview deployment automático
- **Push para `main`**: Production deployment automático

### Backend → Neon Functions (Automático via GitHub Actions)

**Configurar GitHub Actions Secrets:**
- `NEON_API_KEY` (Neon Console > Account > API Keys)
- `NEON_PROJECT_ID` (Neon Console > Project Settings > General)

**Deploy automático:**
- **Push para `main`**: Staging → Production (com aprovação manual)

### Deploy Manual (se necessário)

```bash
# Frontend - Vercel
cd apps/frontend
vercel --prod

# Backend - Neon Functions
neon functions deploy --branch production
```

## CI/CD Pipeline

`.github/workflows/ci.yml` executa em sequência:

```
┌─────────────┐
│   Lint      │  ← TypeScript, ESLint, Oxlint
│ Type Check  │
└──────┬──────┘
       │
┌──────▼──────┐
│    Test     │  ← Jest (backend), Vitest (frontend)
└──────┬──────┘
       │
┌──────▼──────┐
│    Build    │  ← Turborepo (shared → backend → frontend)
└──────┬──────┘
       │
       ├───► Deploy Frontend Preview (PRs) ──► Vercel Preview URL
       │
       ├───► Deploy Frontend Production (main) ──► Vercel Production
       │
       ├───► Deploy Backend Staging (main) ──► Neon Functions Staging
       │
       └───► Deploy Backend Production (main) ──► Neon Functions Production
```

### Secrets Necessários no GitHub

| Secret | Usado por | Onde obter |
|--------|-----------|------------|
| `VERCEL_TOKEN` | Frontend deploy | Vercel > Account > Tokens |
| `VERCEL_ORG_ID` | Frontend deploy | Vercel > Project > General |
| `VERCEL_PROJECT_ID` | Frontend deploy | Vercel > Project > General |
| `NEON_API_KEY` | Backend deploy | Neon > Account > API Keys |
| `NEON_PROJECT_ID` | Backend deploy | Neon > Project > General |
| `TURBO_TOKEN` | Turborepo cache (opcional) | Turborepo > Account |
| `TURBO_TEAM` | Turborepo cache (opcional) | Turborepo > Account |

## Tecnologias

### Backend
- NestJS 10
- TypeORM 0.3
- PostgreSQL (Neon)
- Neon Auth (@neon/auth)
- Passport + JWKS RSA
- Swagger/OpenAPI
- Jest + Supertest

### Frontend
- React 19
- TypeScript
- Vite 8
- React Bootstrap 2
- TanStack Query 5
- React Hook Form + Zod
- Axios
- Vitest

### Shared
- Zod (validação)
- TypeScript types
- Utility functions
- Auth helpers

## Otimizações Vercel (Frontend)

O `apps/frontend/vercel.json` configura:

- **SPA Routing**: Rewrite all routes to `index.html`
- **Cache Headers**: Assets com `Cache-Control: immutable` (1 ano)
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, CSP
- **Build Command**: Instala apenas dependências do frontend + shared
- **Output Directory**: `apps/frontend/dist`

### Chunk Splitting (vite.config.ts)

```typescript
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  ui: ['react-bootstrap', 'bootstrap'],
  query: ['@tanstack/react-query'],
  forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
}
```

## Troubleshooting

### Build falha no Vercel
- Verifique se `VITE_API_URL` está configurado no Vercel
- Verifique se `pnpm install` roda corretamente (lockfile sincronizado)

### API retorna CORS error
- Configure `CORS_ORIGIN` no backend = URL do frontend Vercel
- Ex: `CORS_ORIGIN=https://estoque-cris.vercel.app`

### Neon Auth não funciona no frontend
- Verifique `VITE_NEON_AUTH_BASE_URL` no Vercel
- Certifique-se que o domínio Vercel está em "Trusted Domains" no Neon Auth

### Variáveis não expostas no client
- Variáveis do cliente DEVEM ter prefixo `VITE_`
- Rebuild após alterar variáveis no Vercel Dashboard

## Licença

MIT