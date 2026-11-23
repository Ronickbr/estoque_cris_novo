# Estoque Cris Monorepo Makefile
.PHONY: help install build dev test lint format clean vercel-login vercel-deploy-preview vercel-deploy-prod neon-deploy neon-dev neon-functions ci migrate seed health turbo-build turbo-test turbo-lint

# Default target
help:
	@echo "Estoque Cris Monorepo - Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  install                - Install all dependencies (pnpm)"
	@echo "  build                  - Build all packages"
	@echo "  dev                    - Start all dev servers (backend:5000, frontend:3000)"
	@echo "  test                   - Run all tests"
	@echo "  lint                   - Lint all packages"
	@echo "  format                 - Format code with Prettier"
	@echo "  clean                  - Clean build artifacts and node_modules"
	@echo ""
	@echo "Vercel (Frontend):"
	@echo "  vercel-login           - Login to Vercel CLI"
	@echo "  vercel-deploy-preview  - Deploy frontend to Vercel Preview"
	@echo "  vercel-deploy-prod     - Deploy frontend to Vercel Production"
	@echo ""
	@echo "Neon (Backend):"
	@echo "  neon-deploy            - Deploy backend infra to Neon"
	@echo "  neon-dev               - Start Neon local dev (backend)"
	@echo "  neon-functions         - Deploy Neon Functions (backend)"
	@echo ""
	@echo "CI/CD:"
	@echo "  ci                     - Run full CI pipeline locally"
	@echo ""
	@echo "Database (Backend):"
	@echo "  migrate                - Run migrations"
	@echo "  migrate-generate       - Generate new migration (NAME=...)"
	@echo "  migrate-revert         - Revert last migration"
	@echo "  seed                   - Seed database"
	@echo ""
	@echo "Health Checks:"
	@echo "  health                 - Check backend (5000) and frontend (3000)"
	@echo ""
	@echo "Turbo:"
	@echo "  turbo-build            - Turbo build"
	@echo "  turbo-test             - Turbo test"
	@echo "  turbo-lint             - Turbo lint"

# Install dependencies
install:
	pnpm install --frozen-lockfile

# Build all packages
build:
	pnpm run build

# Start development servers
dev:
	pnpm run dev

# Run tests
test:
	pnpm run test

# Lint all packages
lint:
	pnpm run lint

# Format code
format:
	pnpm run format

# Clean build artifacts
clean:
	rm -rf node_modules
	rm -rf apps/backend/dist
	rm -rf apps/backend/node_modules
	rm -rf apps/frontend/dist
	rm -rf apps/frontend/node_modules
	rm -rf packages/shared/node_modules
	rm -rf .turbo

# Vercel commands (Frontend)
vercel-login:
	@echo "Logging into Vercel..."
	vercel login

vercel-deploy-preview:
	@echo "Deploying frontend to Vercel Preview..."
	cd apps/frontend && vercel --token=$$VERCEL_TOKEN --scope=$$VERCEL_ORG_ID

vercel-deploy-prod:
	@echo "Deploying frontend to Vercel Production..."
	cd apps/frontend && vercel --prod --token=$$VERCEL_TOKEN --scope=$$VERCEL_ORG_ID

# Neon commands (Backend)
neon-deploy:
	@if [ -z "$$NEON_API_KEY" ]; then echo "NEON_API_KEY not set"; exit 1; fi
	cd apps/backend && neon deploy

neon-dev:
	cd apps/backend && neon dev

neon-functions:
	@if [ -z "$$NEON_API_KEY" ]; then echo "NEON_API_KEY not set"; exit 1; fi
	cd apps/backend && neon functions deploy

# CI pipeline
ci: install lint test build

# Database migrations (backend)
migrate:
	cd apps/backend && npm run migration:run

migrate-generate:
	cd apps/backend && npm run migration:generate --name=$(NAME)

migrate-revert:
	cd apps/backend && npm run migration:revert

# Seed database
seed:
	cd apps/backend && npm run seed

# Health checks
health:
	@curl -sf http://localhost:5000/health/live > /dev/null && echo "Backend (5000): OK" || echo "Backend (5000): FAIL"
	@curl -sf http://localhost:3000/health > /dev/null && echo "Frontend (3000): OK" || echo "Frontend (3000): FAIL"

# Turbo commands
turbo-build:
	npx turbo run build

turbo-test:
	npx turbo run test

turbo-lint:
	npx turbo run lint