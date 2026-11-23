# Estoque Cris - Bugs & Evidence (Static Analysis)

## Critical Bugs

### C1: Missing Rate Limiting on Auth Endpoints
**Severity**: Critical
**Location**: `src/main.ts`, `src/app.module.ts`
**Evidence**: Swagger documents 429 response for login but no `ThrottlerModule` imported
```typescript
// Expected in app.module.ts:
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
// ...
ThrottlerModule.forRoot([{
  ttl: 60000,
  limit: 10,
}]),
// And in main.ts:
app.useGlobalGuards(app.get(ThrottlerGuard));
```
**Impact**: Brute-force attacks possible on `/auth/login`, `/auth/register`, `/auth/forgot-password`

---

### C2: Refresh Token Rotation Not Verified
**Severity**: Critical
**Location**: `src/modules/auth/services/auth.service.ts` (not fully visible)
**Evidence**: `refresh()` endpoint returns `RefreshTokenResponseDto` but implementation unclear
```typescript
// Need to verify:
async refreshToken(userId: number): Promise<RefreshTokenResponseDto> {
  // Should: invalidate old refresh token, issue new pair
  // Current: may reuse same refresh token
}
```
**Impact**: Token replay attacks if refresh token not rotated

---

### C3: Potential Shell Injection in Backup
**Severity**: Critical
**Location**: `src/modules/backup/backup.service.ts:68-75`
**Evidence**: DATABASE_URL parsed but password used directly in exec
```typescript
const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} ...`;
await execAsync(command, { env: { ...process.env, PGPASSWORD: password } });
```
**Mitigation**: `URL` parsing helps but special chars in password could break shell escaping
**Fix**: Use `pg_dump` library or sanitize all inputs with `shlex.quote()`

---

## High Bugs

### H1: Batch Movement Deadlock Risk
**Severity**: High
**Location**: `src/modules/inventory-movements/inventory-movements.service.ts:138-175`
**Evidence**: Sequential locking in loop without consistent ordering
```typescript
for (const movementDto of movements) {
  const product = await manager
    .createQueryBuilder(Product, 'p')
    .setLock('pessimistic_write')
    .where('p.id = :productId', { productId: movementDto.productId })
    .getOne();
  // ...
}
```
**Impact**: Concurrent batch requests with overlapping products in different order → deadlock
**Fix**: Sort `movements` by `productId` before processing

---

### H2: Export Memory Exhaustion
**Severity**: High
**Location**: `src/modules/reports/reports.service.ts:85`
**Evidence**: Hardcoded limit of 10,000 records loaded into memory
```typescript
const data = await this.getLowStockProducts(1, 10000); // No upper bound
// ExcelJS workbook holds all in memory
```
**Impact**: OOM crash on large datasets
**Fix**: Implement streaming export or chunked processing

---

### H3: Unused Manufacturer Filter in Reports
**Severity**: High
**Location**: `src/modules/reports/reports.service.ts:35-45`
**Evidence**: `ReportQueryDto` has `manufacturerId` but `generateReport()` switch doesn't use it
```typescript
// In ReportQueryDto:
@IsOptional() @IsUUID() manufacturerId?: string;

// In generateReport():
case ReportType.STOCK_BY_MANUFACTURER:
  return this.getStockByManufacturer(); // Ignores manufacturerId filter
```
**Impact**: Filter silently ignored - confusing UX

---

### H4: CSV Export Path Untested
**Severity**: High
**Location**: `src/modules/reports/reports.service.ts:100-105`
**Evidence**: DTO accepts `format: 'xlsx' | 'csv'` but only xlsx implementation visible
```typescript
res.setHeader('Content-Type', format === 'xlsx'
  ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  : 'text/csv');
// But workbook.xlsx.writeBuffer() only produces xlsx
```
**Impact**: CSV export returns corrupt/empty file

---

## Medium Bugs

### M1: No User Self-Management Endpoint
**Severity**: Medium
**Location**: `src/modules/users/users.controller.ts`
**Evidence**: All endpoints require `@Roles(UserRole.ADMIN)`
**Impact**: Regular users cannot update own profile (must use `/auth/profile` instead)

---

### M2: Password Policy Not Enforced on Login
**Severity**: Medium
**Location**: `src/modules/auth/services/auth.service.ts` (login method)
**Evidence**: Policy validated on register/change-password but not on login
**Impact**: Users with weak passwords (pre-policy) can still login

---

### M3: No Soft Delete / Audit Trail
**Severity**: Medium
**Location**: All entities and services
**Evidence**: All delete operations are hard deletes (`DELETE` SQL)
**Impact**: No recovery from accidental deletes, no audit history

---

### M4: Swagger Enabled via NODE_ENV Check Only
**Severity**: Medium
**Location**: `src/main.ts:58`
**Evidence**: `if (configService.get<string>('NODE_ENV') !== 'production')`
**Impact**: If NODE_ENV not set correctly in prod, Swagger exposed

---

### M5: UUID vs INT Primary Key Inconsistency
**Severity**: Medium
**Location**: `src/modules/users/entities/user.entity.ts` vs others
**Evidence**: Users use `serial` (INT), others use UUID
```typescript
// User:
@PrimaryGeneratedColumn('increment') id: number;

// Product/Manufacturer/Movement:
@PrimaryGeneratedColumn('uuid') id: string;

// Movement FK to User:
@Column({ name: 'created_by', type: 'int' }) createdBy: number;
```
**Impact**: Mixed ID types, potential confusion in API consumers

---

## Low Bugs

### L1: Portuguese Enum Values in Code
**Severity**: Low
**Location**: `src/modules/users/entities/user.entity.ts:14`
**Evidence**: 
```typescript
export enum UserRole {
  ADMIN = 'admin',
  USER = 'usuario',  // Portuguese
}
```
**Impact**: Inconsistent language in codebase

---

### L2: Test Console Mocking Hides Errors
**Severity**: Low
**Location**: `test/setup.ts:22-30`
**Evidence**: All console methods replaced with `jest.fn()`
```typescript
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```
**Impact**: Real errors during tests are silenced

---

### L3: No E2E Tests Exist
**Severity**: Low
**Location**: `test/` directory
**Evidence**: Only `jest-e2e.json` and `setup.ts` - no `.e2e-spec.ts` files
**Impact**: No automated integration testing

---

### L4: Dev Command in Dockerfile
**Severity**: Low
**Location**: `Dockerfile` (not fully visible but docker-compose uses `npm run start:dev`)
**Evidence**: `command: npm run start:dev` in docker-compose.yml
**Impact**: Not production-ready; uses ts-node/watch mode

---

## Validation Gaps

| Endpoint | Missing Validation |
|----------|-------------------|
| `/auth/login` | No rate limit, identifier format (email vs username) |
| `/auth/register` | Password policy enforced but not complexity feedback |
| `/products` POST | No duplicate name check per manufacturer (only unique name global) |
| `/inventory-movements` POST | Notes max 255 but DB column is TEXT |
| `/reports/export` | No max date range limit |
| `/backup` POST | No confirmation/protection against accidental backup spam |

---

## Security Checklist

| Check | Status | Notes |
|-------|--------|-------|
| JWT secret rotation | ❌ | Single secret in env |
| Token blacklist/logout | ❌ | No token invalidation on logout |
| Password history | ❌ | Can reuse old passwords |
| Account lockout | ❌ | Only rate limit (missing) |
| Audit logging | ❌ | No sensitive operation logs |
| CORS configuration | ✅ | Configurable origin |
| Helmet headers | ✅ | Enabled (CSP disabled for API) |
| Input sanitization | ✅ | ValidationPipe + class-validator |
| SQL injection protection | ✅ | TypeORM parameterized queries |
| Path traversal (backup) | ✅ | path.basename() used |
| XSS protection | ⚠️ | No output encoding visible |

---

**Generated**: 2026-11-22
**Analyzer**: Estoque Cris | QA
**Method**: Static code review