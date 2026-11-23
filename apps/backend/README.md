# Estoque Cris - Node.js + NestJS + Neon PostgreSQL

Sistema de Gerenciamento de Estoque migrado de PHP para Node.js com NestJS, TypeScript e Neon (serverless PostgreSQL).

## 🚀 Tecnologias

- **Node.js** 20+
- **NestJS** 10+ - Framework Node.js estruturado
- **TypeScript** 5+ - Tipagem estática
- **TypeORM** 0.3+ - ORM para PostgreSQL
- **Neon** - PostgreSQL serverless
- **JWT** - Autenticação stateless
- **Passport** - Estratégias de autenticação
- **Class Validator/Transformer** - Validação e transformação de DTOs
- **Swagger/OpenAPI** - Documentação da API
- **ExcelJS** - Exportação de relatórios para Excel
- **Jest** - Testes unitários e e2e

## 📋 Funcionalidades

- ✅ Autenticação JWT (login, registro, refresh token)
- ✅ Gestão de usuários (admin/usuario)
- ✅ Gestão de fabricantes
- ✅ Gestão de produtos com controle de estoque
- ✅ Movimentações de estoque (entrada/saída) com validação atômica
- ✅ Relatórios (estoque por fabricante, estoque baixo, movimentações, estatísticas)
- ✅ Exportação de relatórios (Excel/CSV)
- ✅ Backup e restauração do banco de dados
- ✅ Upload de imagens de produtos
- ✅ Auditoria de ações (logs)
- ✅ Políticas de senha configuráveis
- ✅ Rate limiting para login

## 🏗️ Arquitetura

```
src/
├── common/                 # Utilitários compartilhados
│   ├── decorators/         # Decorators personalizados
│   ├── filters/            # Filtros de exceção
│   ├── guards/             # Guards de autenticação/autorização
│   ├── interceptors/       # Interceptors (logging, transform)
│   └── pipes/              # Pipes de validação
├── config/                 # Configurações (database, jwt)
├── database/               # Migrations e data source
├── modules/                # Módulos de funcionalidades
│   ├── auth/               # Autenticação e autorização
│   ├── users/              # Gestão de usuários
│   ├── manufacturers/      # Gestão de fabricantes
│   ├── products/           # Gestão de produtos
│   ├── inventory-movements/# Movimentações de estoque
│   ├── reports/            # Relatórios e exportação
│   ├── backup/             # Backup/restore
│   └── uploads/            # Upload de arquivos
└── main.ts                 # Entry point
```

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas configurações
# DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require
# JWT_SECRET=sua-chave-secreta-super-segura

# Rodar migrações
npm run migration:run

# Iniciar em desenvolvimento
npm run start:dev
```

## 🔧 Configuração de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente (development/production) | development |
| `PORT` | Porta do servidor | 3000 |
| `API_PREFIX` | Prefixo da API | api/v1 |
| `DATABASE_URL` | URL do Neon PostgreSQL | **Obrigatório** |
| `DATABASE_SSL` | Usar SSL | true |
| `JWT_SECRET` | Chave secreta JWT | **Obrigatório** |
| `JWT_EXPIRES_IN` | Expiração do token | 1h |
| `PASSWORD_MIN_LENGTH` | Tamanho mínimo da senha | 8 |
| `UPLOAD_MAX_SIZE` | Tamanho máximo upload (bytes) | 5242880 |
| `BACKUP_DIR` | Diretório de backups | ./backups |

## 🗄️ Banco de Dados

### Tabelas Principais

- **usuarios** - Usuários do sistema (id, nome, email, senha, nivel, tokens)
- **manufacturers** - Fabricantes (id, name, logo_url)
- **products** - Produtos (id, name, manufacturer_id, stock, min_stock, image_url)
- **inventory_movements** - Movimentações (id, product_id, type, quantity, notes, created_by)

### Views

- **v_stock_by_manufacturer** - Estoque agregado por fabricante
- **v_low_stock_products** - Produtos com estoque baixo

### Triggers

- **trg_inventory_movements_validation** - Valida tipo, quantidade e estoque antes de insert

## 🔐 Autenticação

### Login
```bash
POST /api/v1/auth/login
{
  "identifier": "admin@example.com",
  "password": "Admin@123!"
}
```

### Refresh Token
```bash
POST /api/v1/auth/refresh
Authorization: Bearer <access_token>
```

### Endpoints Protegidos
Todos os endpoints (exceto `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/password-policy`) requerem header:
```
Authorization: Bearer <access_token>
```

## 📚 Documentação da API

Acesse a documentação Swagger em:
```
http://localhost:3000/api/docs
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes com coverage
npm run test:cov

# Testes e2e
npm run test:e2e
```

## 📊 Scripts Disponíveis

```bash
npm run build          # Build para produção
npm run start          # Iniciar produção
npm run start:dev      # Iniciar desenvolvimento (watch)
npm run start:debug    # Iniciar com debug
npm run lint           # Lint + fix
npm run test           # Testes unitários
npm run test:watch     # Testes em watch mode
npm run test:cov       # Testes com coverage
npm run test:e2e       # Testes e2e
npm run migration:generate # Gerar migration
npm run migration:run      # Rodar migrations
npm run migration:revert   # Reverter última migration
```

## 🔄 Migração do PHP

Este projeto é uma migração do sistema PHP original (`Estoque_cris_php`). Principais mudanças:

| PHP | Node.js |
|-----|---------|
| PHP 8.1+ | Node.js 20+ |
| MVC com pages/ | NestJS Modules |
| PDO MySQL | TypeORM + Neon PostgreSQL |
| Session-based auth | JWT Stateless auth |
| UUID manual | uuid-ossp / crypto.randomUUID |
| Triggers MySQL | Triggers PostgreSQL (plpgsql) |
| PhpSpreadsheet | ExcelJS |
| Rotas em public/index.php | NestJS Router + Controllers |

## 📁 Estrutura de Migração

```
PHP (original)          →  Node.js (novo)
─────────────────────────────────────────────────────
pages/dashboard.php     →  GET /api/v1/products (dashboard data)
pages/produtos/*        →  /api/v1/products/*
pages/fabricantes/*     →  /api/v1/manufacturers/*
pages/relatorios/*      →  /api/v1/reports/*
pages/backup/*          →  /api/v1/backup/*
pages/perfil/*          →  /api/v1/auth/me, /auth/profile, etc.
login.php               →  POST /api/v1/auth/login
criar_usuario.php       →  POST /api/v1/auth/register (admin)
includes/funcoes.php    →  Services + Helpers
config/schema.sql       →  TypeORM Migrations
src/Estoque/Services/*  →  modules/*/services/*.service.ts
src/Estoque/Models/*    →  modules/*/entities/*.entity.ts
src/Estoque/Controllers/* → modules/*/*.controller.ts
```

## 🚀 Deploy

### Docker
```bash
docker build -t estoque-cris .
docker run -p 3000:3000 --env-file .env estoque-cris
```

### Variáveis de Produção
```bash
NODE_ENV=production
JWT_SECRET=chave-super-segura-aleatoria-256-bits
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require
```

## 📝 Licença

Projeto interno - Estoque Cris