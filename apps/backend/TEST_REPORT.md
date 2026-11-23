# Estoque Cris - Node.js/NestJS/Neon Migration Test Report

**Project**: `/var/lib/openbot/OpenBot/Agents/agent-cf303b28-db9b-483b-be30-28fd65752070/estoque-cris-nodejs/`
**Date**: 2026-11-22
**Tester**: Estoque Cris | QA
**Method**: Static Code Analysis (no runtime environment available)

---

## 📋 Executive Summary

| Metric | Status |
|--------|--------|
| **Endpoints Covered** | 32 endpoints across 7 modules |
| **Auth System** | JWT + Passport + Role-based (admin/usuario) |
| **Validation** | class-validator + global ValidationPipe |
| **Database** | TypeORM + PostgreSQL (Neon-ready) + UUID PKs |
| **Pessimistic Locking** | ✅ Implemented (SELECT FOR UPDATE) |
| **Excel Export** | ✅ ExcelJS implemented |
| **Swagger Docs** | ✅ Available at `/api/docs` (dev only) |

---

## 🎯 Test Coverage by Module

### 1. AUTH Module (`/api/v1/auth`)

| Endpoint | Method | Auth | Roles | Validation | Expected Status |
|----------|--------|------|-------|------------|-----------------|
| `/login` | POST | Public | - | LoginDto (identifier, password) | 200, 401, 429 |
| `/register` | POST | JWT | admin | RegisterDto (nome, email, senha, nivel) | 201, 400, 401, 403, 409 |
| `/refresh` | POST | JWT | - | CurrentUser decorator | 200, 401 |
| `/me` | GET | JWT | - | - | 200, 401 |
| `/change-password` | POST | JWT | - | ChangePasswordDto | 200, 400, 401 |
| `/change-email` | POST | JWT | - | ChangeEmailDto | 200, 400, 401, 409 |
| `/profile` | POST | JWT | - | {nome, email} | 200, 400, 409 |
| `/forgot-password` | POST | Public | - | RequestPasswordResetDto (email) | 200 |
| `/reset-password` | POST | Public | - | ResetPasswordDto (token, senha) | 200, 400 |
| `/password-policy` | GET | Public | - | - | 200 |

**Validation Rules Found:**
- `LoginDto`: identifier (1-100 chars), password (1-255 chars)
- `RegisterDto`: nome (2-100), email (valid, max 100), senha (8-255, policy enforced), nivel (enum: admin/usuario)
- Password policy: min 8 chars, uppercase, lowercase, number, symbol required

**Potential Issues:**
- ⚠️ `identifier` field accepts both email OR username - but validation only checks string length
- ⚠️ Rate limiting on login mentioned in Swagger (429) but no throttle guard visible in code
- ⚠️ `forgot-password` returns 200 even if email doesn't exist (security: user enumeration prevention) - ✅ correct behavior
- ⚠️ No `@Public()` decorator visible on login/forgot-password/reset-password - relies on `IS_PUBLIC_KEY` reflector

---

### 2. USERS Module (`/api/v1/users`)

| Endpoint | Method | Auth | Roles | Validation | Expected Status |
|----------|--------|------|-------|------------|-----------------|
| `/` | GET | JWT | admin | Query: page, perPage | 200 |
| `/:id` | GET | JWT | admin | Param: id (int) | 200, 404 |
| `/` | POST | JWT | admin | CreateUserDto | 201, 400, 409 |
| `/:id` | PUT | JWT | admin | UpdateUserDto | 200, 404, 409 |
| `/:id` | DELETE | JWT | admin | Param: id (int) | 204, 404, 400 |

**Potential Issues:**
- ⚠️ All endpoints require `admin` role - no self-management for regular users
- ⚠️ DELETE returns 400 "Cannot delete last admin" - logic needs verification
- ⚠️ `UserRole` enum uses Portuguese values: `admin` / `usuario` - ensure consistency with JWT strategy

---

### 3. MANUFACTURERS Module (`/api/v1/manufacturers`)

| Endpoint | Method | Auth | Roles | Validation | Expected Status |
|----------|--------|------|-------|------------|-----------------|
| `/` | GET | JWT | any | Query: page, perPage | 200 |
| `/select` | GET | JWT | any | - | 200 |
| `/:id` | GET | JWT | any | Param: id (UUID) | 200, 404 |
| `/` | POST | JWT | admin | CreateManufacturerDto (name, logoUrl?) | 201, 400, 403, 409 |
| `/:id` | PUT | JWT | admin | UpdateManufacturerDto | 200, 404, 403, 409 |
| `/:id` | DELETE | JWT | admin | Param: id (UUID) | 204, 404, 400, 403 |

**Potential Issues:**
- ✅ `select` endpoint for dropdowns - good UX
- ⚠️ DELETE returns 400 if manufacturer has products (RESTRICT FK) - correct
- ⚠️ UUID validation on params - ensure proper error messages

---

### 4. PRODUCTS Module (`/api/v1/products`)

| Endpoint | Method | Auth | Roles | Validation | Expected Status |
|----------|--------|------|-------|------------|-----------------|
| `/` | GET | JWT | any | ProductQueryDto (page, perPage, name, manufacturerId, stock) | 200 |
| `/low-stock` | GET | JWT | any | - | 200 |
| `/stock-by-manufacturer` | GET | JWT | any | - | 200 |
| `/select` | GET | JWT | any | - | 200 |
| `/:id` | GET | JWT | any | Param: id (UUID) | 200, 404 |
| `/:id/movements` | GET | JWT | any | Query: page, perPage | 200, 404 |
| `/` | POST | JWT | admin, usuario | CreateProductDto | 201, 400, 403, 404 |
| `/:id` | PUT | JWT | admin, usuario | UpdateProductDto | 200, 404, 403 |
| `/adjust-stock` | POST | JWT | admin, usuario | AdjustStockDto (productId, quantity, type) | 200, 404, 403 |
| `/:id` | DELETE | JWT | admin | Param: id (UUID) | 204, 404, 400, 403 |

**Validation Rules:**
- `CreateProductDto`: name (1-255), manufacturerId (UUID, required), stock (int ≥0, default 0), minStock (int ≥0, default 5), imageUrl (optional URL)
- `stock` query filter enum: `low` | `medium` | `high`

**Potential Issues:**
- ⚠️ `adjust-stock` endpoint - need to verify it uses pessimistic locking like movements
- ⚠️ `stockStatus` computed property: `zerado`/`critico`/`baixo`/`ok` - ensure consistent with reports
- ⚠️ No `usuario` role can delete products - only admin (correct)

---

### 5. INVENTORY MOVEMENTS Module (`/api/v1/inventory-movements`)

| Endpoint | Method | Auth | Roles | Validation | Expected Status |
|----------|--------|------|-------|------------|-----------------|
| `/` | GET | JWT | any | MovementQueryDto (page, perPage, productId, type, createdBy, startDate, endDate) | 200 |
| `/stats` | GET | JWT | any | Query: days (default 30) | 200 |
| `/:id` | GET | JWT | any | Param: id (UUID) | 200, 404 |
| `/` | POST | JWT | admin, usuario | CreateMovementDto (productId UUID, type enum, quantity ≥1, notes?) | 201, 400, 403, 404 |
| `/batch` | POST | JWT | admin, usuario | CreateBatchMovementDto (movements[]) | 201, 400, 403, 404 |

**Pessimistic Locking Implementation** ✅ **VERIFIED**
```typescript
// In create() and createBatch():
const product = await manager
  .createQueryBuilder(Product, 'p')
  .setLock('pessimistic_write')  // SELECT FOR UPDATE
  .where('p.id = :productId', { productId })
  .getOne();

// Stock validation BEFORE update
if (type === MovementType.EXIT && product.stock < quantity) {
  throw new BadRequestException(...);
}

// Atomic stock update + movement creation in same transaction
await manager.update(Product, productId, { stock: newStock, updatedAt: new Date() });
const movement = manager.create(InventoryMovement, {...});
await manager.save(movement);
```

**Database-Level Trigger** ✅ **ADDITIONAL SAFETY**
```sql
-- Migration creates BEFORE INSERT trigger with FOR UPDATE
CREATE TRIGGER trg_inventory_movements_validation
BEFORE INSERT ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION validate_inventory_movement();
```

**Potential Issues:**
- ✅ Double protection: application-level + database-level
- ⚠️ Batch operations lock products sequentially - could cause deadlocks under high concurrency
- ⚠️ No `type` validation in DTO beyond enum - ensure `entrada`/`saida` only

---

### 6. REPORTS Module (`/api/v1/reports`)

| Endpoint | Method | Auth | Roles | Validation | Expected Status |
|----------|--------|------|-------|------------|-----------------|
| `/` | GET | JWT | any | ReportQueryDto (type, page, perPage, filters...) | 200, 404 |
| `/export` | POST | JWT | any | ExportQueryDto (type, format, productId, dates) | 200 (file), 404 |
| `/stock-by-manufacturer` | GET | JWT | any | - | 200 |
| `/low-stock` | GET | JWT | any | Query: page, perPage | 200 |
| `/sales-stats` | GET | JWT | any | Query: days (default 30) | 200 |

**Report Types** (`ReportType` enum):
- `stock_by_manufacturer` - aggregated per manufacturer
- `low_stock` - products below minStock
- `movements` - filtered movement history
- `product_movements` - movements for specific product (requires productId)
- `sales_stats` - entry/exit counts and quantities over N days

**Excel Export** ✅ **VERIFIED** (ExcelJS)
```typescript
// In exportReport():
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Relatório');
// Headers styled with bold, blue background, white text
// Data rows added per report type
// Auto-fit columns
return workbook.xlsx.writeBuffer(); // Returns Buffer
```

**Response Headers Set:**
- `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx) or `text/csv`
- `Content-Disposition`: `attachment; filename="relatorio_{type}_{date}.{format}"`

**Potential Issues:**
- ⚠️ Export loads up to 10,000 records in memory - could OOM on large datasets
- ⚠️ CSV format mentioned in DTO enum but implementation only shows xlsx path - verify CSV works
- ⚠️ `manufacturerId` filter in ReportQueryDto but not used in generateReport switch

---

### 7. BACKUP Module (`/api/v1/backup`)

| Endpoint | Method | Auth | Roles | Validation | Expected Status |
|----------|--------|------|-------|------------|-----------------|
| `/` | GET | JWT | admin | - | 200 |
| `/` | POST | JWT | admin | - | 201, 500 |
| `/:filename/download` | GET | JWT | admin | Param: filename (basename, .sql) | 200 (file), 404 |
| `/:filename/restore` | POST | JWT | admin | Param: filename | 200, 404, 500 |
| `/:filename` | DELETE | JWT | admin | Param: filename | 200, 404 |
| `/clean` | POST | JWT | admin | - | 200 |

**Implementation Details:**
- Uses `pg_dump` / `psql` via `child_process.execAsync`
- Sanitizes filename with `path.basename()` - prevents directory traversal ✅
- Validates `.sql` extension ✅
- Auto-cleanup keeps last `BACKUP_MAX_FILES` (default 30) ✅
- Runs in transaction? No - pg_dump is external process

**Potential Issues:**
- ⚠️ Requires `pg_dump`/`psql` binaries in container - verify Dockerfile
- ⚠️ Restore drops/recreates data - dangerous in production
- ⚠️ No progress indication for large databases
- ⚠️ `DATABASE_URL` parsing assumes standard format - test with Neon connection strings

---

## 🔐 Security Analysis

### Authentication (JWT)
- **Strategy**: Passport JWT (`jwt.strategy.ts`)
- **Token**: Access token (1h default) + Refresh token (7d)
- **Secret**: `JWT_SECRET` env var
- **Algorithm**: HS256 (default)

### Authorization (Roles)
- **Roles**: `admin` | `usuario` (Portuguese)
- **Guards**: `JwtAuthGuard` → `RolesGuard`
- **Decorator**: `@Roles(UserRole.ADMIN, UserRole.USER)`

### Validation
- **Global**: `ValidationPipe` (whitelist, forbidNonWhitelisted, transform)
- **DTOs**: class-validator decorators
- **Error Format**: `{ message: "Erro de validação", errors: string[] }`

### Potential Security Issues:
| Issue | Severity | Location |
|-------|----------|----------|
| No rate limiting on auth endpoints | Medium | `main.ts` - no ThrottlerModule |
| Password policy enforced only on register/change | Low | `auth.service.ts` |
| JWT refresh token rotation not visible | Medium | `auth.service.ts` refreshToken() |
| Backup uses shell exec with env vars | Low | `backup.service.ts` - PGPASSWORD |
| No audit logging for sensitive operations | Low | All controllers |

---

## 🗄️ Database Schema Analysis

### Tables
1. **usuarios** - id (serial), nome, email, senha (bcrypt), nivel, token_reset, token_expiracao, timestamps
2. **manufacturers** - id (uuid), name, logo_url, timestamps
3. **products** - id (uuid), name, manufacturer_id (FK), stock, min_stock, image_url, timestamps
4. **inventory_movements** - id (uuid), product_id (FK), type (entrada/saida), quantity, notes, created_by (FK), created_at

### Indexes
- All FK columns indexed
- Composite: `idx_inventory_movements_product_created` (product_id, created_at)
- Unique: email, nome (usuarios), name (manufacturers)

### Views
- `v_stock_by_manufacturer` - aggregated stock per manufacturer
- `v_low_stock_products` - products with status (zerado/critico/baixo/ok)

### Triggers
- `trg_inventory_movements_validation` - BEFORE INSERT on inventory_movements
  - Validates type enum
  - Validates quantity > 0
  - Checks stock FOR UPDATE on exits

---

## 🐛 Bugs & Issues Found (Static Analysis)

### Critical
| # | Issue | File | Description |
|---|-------|------|-------------|
| C1 | Missing ThrottlerModule | `main.ts`, `app.module.ts` | Login brute-force protection advertised (429) but not implemented |
| C2 | No refresh token rotation | `auth.service.ts` | Refresh returns new access token but same refresh? Need verification |
| C3 | Backup shell injection risk | `backup.service.ts` | `databaseUrl` parsed but not fully sanitized before exec |

### High
| # | Issue | File | Description |
|---|-------|------|-------------|
| H1 | Batch movement deadlock risk | `inventory-movements.service.ts` | Sequential locking in loop - sort by productId to prevent deadlocks |
| H2 | Export memory limit | `reports.service.ts` | Loads 10k records into ExcelJS workbook in memory |
| H3 | ManufacturerId filter unused | `reports.service.ts` | ReportQueryDto has manufacturerId but generateReport doesn't use it |
| H4 | CSV export untested | `reports.service.ts` | DTO accepts 'csv' but code path only shows xlsx |

### Medium
| # | Issue | File | Description |
|---|-------|------|-------------|
| M1 | User self-management missing | `users.controller.ts` | No `/me` equivalent for users module |
| M2 | Password policy not on login | `auth.service.ts` | Login doesn't verify policy compliance |
| M3 | No soft delete | All entities | Hard deletes only - consider audit trail |
| M4 | Swagger in production | `main.ts` | Disabled in prod but env check only |
| M5 | UUID vs INT inconsistency | `users` vs others | Users use serial INT, others UUID - FK from movements to users is INT |

### Low
| # | Issue | File | Description |
|---|-------|------|-------------|
| L1 | Portuguese enum in code | `user.entity.ts` | `UserRole.USER = 'usuario'` - mixing languages |
| L2 | Console mocked in tests | `test/setup.ts` | All console methods mocked - hides real errors |
| L3 | No integration tests | `test/` | Only setup.ts and config - no actual e2e tests |
| L4 | Dockerfile dev command | `Dockerfile` | Uses `npm run start:dev` - not production ready |

---

## ✅ Test Execution Plan (When Runtime Available)

### Phase 1: Infrastructure Setup
```bash
cd estoque-cris-nodejs
cp .env.example .env
# Edit .env with local PostgreSQL or Neon credentials
docker compose up -d db
# Wait for db healthcheck
npm ci
npm run migration:run
npm run start:dev
# Verify Swagger at http://localhost:3000/api/docs
```

### Phase 2: Auth Flow Tests
| Test | Steps | Expected |
|------|-------|----------|
| T-AUTH-01 | POST /auth/login with valid credentials | 200 + accessToken + refreshToken |
| T-AUTH-02 | POST /auth/login with invalid password | 401 |
| T-AUTH-03 | POST /auth/login with non-existent user | 401 (not 404) |
| T-AUTH-04 | POST /auth/register as admin | 201 + user created |
| T-AUTH-05 | POST /auth/register as usuario | 403 |
| T-AUTH-06 | POST /auth/refresh with valid token | 200 + new accessToken |
| T-AUTH-07 | POST /auth/refresh with expired token | 401 |
| T-AUTH-08 | GET /auth/me with valid token | 200 + user data |
| T-AUTH-09 | POST /auth/change-password correct old | 200 |
| T-AUTH-10 | POST /auth/change-password wrong old | 401 |
| T-AUTH-11 | POST /auth/forgot-password existing email | 200 |
| T-AUTH-12 | POST /auth/forgot-password non-existing | 200 (same response) |
| T-AUTH-13 | POST /auth/reset-password valid token | 200 |
| T-AUTH-14 | POST /auth/reset-password expired token | 400 |
| T-AUTH-15 | GET /auth/password-policy | 200 + policy object |

### Phase 3: CRUD Tests (Users, Manufacturers, Products)
- Test all endpoints with valid/invalid data
- Test pagination, filtering, sorting
- Test role-based access (admin vs usuario)
- Test FK constraints (delete with children)

### Phase 4: Inventory Movement Tests
| Test | Steps | Expected |
|------|-------|----------|
| T-INV-01 | POST /inventory-movements entry | 201 + stock increased |
| T-INV-02 | POST /inventory-movements exit sufficient stock | 201 + stock decreased |
| T-INV-03 | POST /inventory-movements exit insufficient stock | 400 |
| T-INV-04 | POST /inventory-movements/batch multiple | 201 + all applied atomically |
| T-INV-05 | Concurrent exits same product | No oversell (pessimistic lock) |
| T-INV-06 | GET /inventory-movements with filters | 200 + filtered data |
| T-INV-07 | GET /inventory-movements/stats | 200 + stats object |

### Phase 5: Reports Tests
| Test | Steps | Expected |
|------|-------|----------|
| T-RPT-01 | GET /reports?type=stock_by_manufacturer | 200 + aggregated data |
| T-RPT-02 | GET /reports?type=low_stock | 200 + low stock products |
| T-RPT-03 | GET /reports?type=movements&startDate=... | 200 + filtered movements |
| T-RPT-04 | POST /reports/export?type=stock_by_manufacturer&format=xlsx | 200 + .xlsx file |
| T-RPT-05 | POST /reports/export?type=movements&format=csv | 200 + .csv file |
| T-RPT-06 | Large dataset export (>5000 rows) | 200 + file (no OOM) |

### Phase 6: Backup Tests
| Test | Steps | Expected |
|------|-------|----------|
| T-BAK-01 | POST /backup | 201 + backup file created |
| T-BAK-02 | GET /backup | 200 + list with new backup |
| T-BAK-03 | GET /backup/{filename}/download | 200 + .sql file |
| T-BAK-04 | POST /backup/{filename}/restore | 200 + data restored |
| T-BAK-05 | DELETE /backup/{filename} | 200 + file removed |
| T-BAK-06 | POST /backup/clean | 200 + old backups removed |

### Phase 7: Security & Edge Cases
- SQL injection attempts on all inputs
- XSS in text fields
- JWT tampering
- Role escalation attempts
- Large payload DoS
- Concurrent request handling

---

## 📊 Test Evidence Template

For each test executed, record:

```
Test ID: T-AUTH-01
Endpoint: POST /api/v1/auth/login
Input: { "identifier": "admin@example.com", "password": "Admin@123!" }
Expected: 200 OK, { accessToken, refreshToken, user }
Actual: [PASS/FAIL] - [Response details]
Evidence: [Screenshot/Log/Response JSON]
Severity: [Critical/High/Medium/Low] if FAIL
```

---

## 🚀 CI/CD Integration

**GitHub Actions Workflow** (`.github/workflows/test.yml` needed):
```yaml
- Setup Node.js 20
- Setup PostgreSQL 16 (service container)
- npm ci
- npm run migration:run
- npm run test:cov (unit)
- npm run test:e2e (integration)
- Upload coverage
```

**Coverage Targets**: ≥80% statements, branches, functions, lines

---

## 📝 Recommendations

### Immediate (Before Production)
1. Add `@nestjs/throttler` for rate limiting
2. Implement refresh token rotation
3. Add integration/e2e test suite
4. Verify backup/restore with Neon PostgreSQL
5. Test CSV export path

### Short-term
1. Add soft delete / audit trail
2. Implement request/response logging for audit
3. Add health check endpoint
4. Document API versioning strategy
5. Load test inventory movements under concurrency

### Long-term
1. Migrate to PostgreSQL advisory locks for distributed locking
2. Add WebSocket for real-time stock updates
3. Implement API key authentication for integrations
4. Add OpenTelemetry tracing

---

## 📎 Files Analyzed

| File | Purpose |
|------|---------|
| `src/main.ts` | App bootstrap, Swagger, global pipes/guards |
| `src/app.module.ts` | Module imports |
| `src/common/guards/*.ts` | JWT auth, roles guards |
| `src/common/pipes/validation.pipe.ts` | Global validation |
| `src/modules/auth/*.ts` | Auth endpoints, DTOs, service, strategy |
| `src/modules/users/*.ts` | User management |
| `src/modules/manufacturers/*.ts` | Manufacturer CRUD |
| `src/modules/products/*.ts` | Product CRUD + stock adjust |
| `src/modules/inventory-movements/*.ts` | Movements + pessimistic locking |
| `src/modules/reports/*.ts` | Reports + ExcelJS export |
| `src/modules/backup/*.ts` | Backup/restore with pg_dump |
| `src/database/migrations/*.ts` | Schema, views, triggers |
| `package.json` | Dependencies, scripts |
| `docker-compose.yml` | Dev environment |

---

**Report Generated By**: Estoque Cris | QA
**Status**: Static Analysis Complete - Runtime Tests Pending Infrastructure
**Next Step**: Provision test environment (Docker + PostgreSQL) and execute test plan