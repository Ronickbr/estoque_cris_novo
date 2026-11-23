# Makefile for Estoque Cris Node.js
.PHONY: help install dev test test-unit test-e2e test-cov lint build docker-build docker-up docker-down docker-logs migrate migrate-run migrate-revert clean

# Default target
help:
	@echo "Estoque Cris - Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  install        Install dependencies"
	@echo "  dev            Start development server with hot reload"
	@echo "  dev:db         Start development database only"
	@echo ""
	@echo "Testing:"
	@echo "  test           Run all tests (unit + e2e)"
	@echo "  test-unit      Run unit tests only"
	@echo "  test-e2e       Run e2e tests only"
	@echo "  test-cov       Run tests with coverage"
	@echo "  lint           Run ESLint"
	@echo "  typecheck      Run TypeScript type checking"
	@echo ""
	@echo "Build:"
	@echo "  build          Build for production"
	@echo "  build:prod     Build production Docker image"
	@echo "  build:dev      Build development Docker image"
	@echo ""
	@echo "Docker:"
	@echo "  docker-up      Start all services (app + db)"
	@echo "  docker-down    Stop all services"
	@echo "  docker-logs    View logs from all services"
	@echo "  docker-ps      List running containers"
	@echo ""
	@echo "Database:"
	@echo "  migrate        Generate new migration"
	@echo "  migrate-run    Run pending migrations"
	@echo "  migrate-revert Revert last migration"
	@echo "  schema-sync    Synchronize schema (dev only)"
	@echo ""
	@echo "Cleanup:"
	@echo "  clean          Remove build artifacts and node_modules"

# Development
install:
	npm ci

dev:
	npm run start:dev

dev:db:
	docker-compose up -d db test-db

# Testing
test: test-unit test-e2e

test-unit:
	npm run test

test-e2e:
	docker-compose up -d test-db
	@sleep 5
	DATABASE_URL=postgresql://test:test@localhost:5433/test_db DATABASE_SSL=false NODE_ENV=test JWT_SECRET=test-secret npm run test:e2e

test-cov:
	npm run test:cov

lint:
	npm run lint

typecheck:
	npx tsc --noEmit

# Build
build:
	npm run build

build:prod:
	docker build -f Dockerfile.prod -t estoque-cris:prod .

build:dev:
	docker build -f Dockerfile -t estoque-cris:dev .

# Docker
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down -v

docker-logs:
	docker-compose logs -f

docker-ps:
	docker-compose ps

# Database
migrate:
	@read -p "Migration name: " name; \
	npm run migration:generate -- -n $$name

migrate-run:
	npm run migration:run

migrate-revert:
	npm run migration:revert

schema-sync:
	npm run schema:sync

# Production
prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down -v

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Cleanup
clean:
	rm -rf node_modules dist coverage .tsbuildinfo
	docker-compose down -v --rmi all 2>/dev/null || true

# CI simulation
ci: lint typecheck test-unit
	@echo "CI checks passed!"

# Deploy helpers
deploy-staging:
	@echo "Triggering staging deployment..."
	@git push origin main

deploy-prod:
	@read -p "Version tag (e.g., v2.0.0): " tag; \
	git tag $$tag && git push origin $$tag