@echo off
REM Estoque Cris - Launcher Windows para rodar o sistema completo
REM Uso: duplo clique em run-estoque-cris.bat

title Estoque Cris - Sistema Completo
color 0A

echo ╔══════════════════════════════════════════════════════════╗
echo ║           ESTOQUE CRIS - LAUNCHER WINDOWS                ║
echo ║     React 18 ^+ NestJS ^+ Neon PostgreSQL ^+ Auth           ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js %version%

REM Verificar pnpm
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo [AVISO] pnpm nao encontrado. Instalando via npm...
    npm install -g pnpm
)

REM Verificar se estamos na pasta correta
if not exist "pnpm-workspace.yaml" (
    echo [ERRO] Execute este arquivo na raiz do monorepo (onde esta pnpm-workspace.yaml)
    pause
    exit /b 1
)

echo [INFO] Configurando variaveis de ambiente...
if not exist "apps\backend\.env.local" (
    if exist "apps\backend\.env.example" (
        copy "apps\backend\.env.example" "apps\backend\.env.local" >nul
        echo [OK] Criado apps\backend\.env.local
    )
)
if not exist "apps\frontend\.env.local" (
    if exist "apps\frontend\.env.example" (
        copy "apps\frontend\.env.example" "apps\frontend\.env.local" >nul
        echo [OK] Criado apps\frontend\.env.local
    )
)
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] Criado .env
    )
)

echo [INFO] Instalando dependencias...
pnpm install --frozen-lockfile
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias
    pause
    exit /b 1
)

echo [INFO] Compilando pacotes...
pnpm run build
if errorlevel 1 (
    echo [ERRO] Falha no build
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                    INICIANDO SERVICOS                    ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Iniciar backend em nova janela
start "Estoque Cris - Backend (porta 5000)" cmd /k "
    cd /d %~dp0\apps\backend
    echo [BACKEND] Iniciando na porta 5000...
    pnpm run start:dev
"

REM Aguardar backend subir
timeout /t 5 >nul

REM Iniciar frontend em nova janela
start "Estoque Cris - Frontend (porta 3000)" cmd /k "
    cd /d %~dp0\apps\frontend
    echo [FRONTEND] Iniciando na porta 3000...
    set PORT=3000
    pnpm run dev
"

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                    SISTEMA RODANDO                       ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║  Frontend:  http://localhost:3000                        ║
echo ║  Backend:   http://localhost:5000                        ║
echo ║  API Docs:  http://localhost:5000/api/docs               ║
echo ║  Health:    http://localhost:5000/health/live            ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║  Feche as janelas do terminal para parar os servicos     ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Abrir navegador
start "" "http://localhost:3000"

echo Pressione qualquer tecla para fechar esta janela (os servicos continuam rodando nas outras janelas)...
pause >nul