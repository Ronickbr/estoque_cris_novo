#!/usr/bin/env node
/**
 * Estoque Cris - Launcher único para rodar o sistema completo
 * Uso: node run-estoque-cris.js
 * Ou torne executável: chmod +x run-estoque-cris.js && ./run-estoque-cris.js
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MONOREPO_ROOT = __dirname;
const BACKEND_DIR = path.join(MONOREPO_ROOT, 'apps', 'backend');
const FRONTEND_DIR = path.join(MONOREPO_ROOT, 'apps', 'frontend');
const SHARED_DIR = path.join(MONOREPO_ROOT, 'packages', 'shared');

const REQUIRED_NODE_VERSION = '18.0.0';
const BACKEND_PORT = 5000;
const FRONTEND_PORT = 3000;

let backendProcess = null;
let frontendProcess = null;
let isShuttingDown = false;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  const prefix = {
    info: '[INFO]',
    success: '[OK]',
    warn: '[AVISO]',
    error: '[ERRO]'
  };
  console.log(`${colors[type]}${prefix[type]}${colors.reset} ${message}`);
}

function checkNodeVersion() {
  const currentVersion = process.version.slice(1);
  const required = REQUIRED_NODE_VERSION.split('.').map(Number);
  const current = currentVersion.split('.').map(Number);
  
  for (let i = 0; i < required.length; i++) {
    if (current[i] > required[i]) return true;
    if (current[i] < required[i]) return false;
  }
  return true;
}

function runCommand(cmd, cwd, description) {
  log(`${description}...`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit', shell: true });
    return true;
  } catch (error) {
    log(`Falha ao ${description.toLowerCase()}`, 'error');
    return false;
  }
}

function copyEnvIfMissing(sourceDir, targetFile, exampleFile) {
  const source = path.join(sourceDir, exampleFile);
  const target = path.join(sourceDir, targetFile);
  
  if (!fs.existsSync(target) && fs.existsSync(source)) {
    fs.copyFileSync(source, target);
    log(`Criado ${targetFile} a partir de ${exampleFile}`);
    return true;
  }
  return false;
}

function setupEnvironment() {
  log('Configurando variáveis de ambiente...');
  
  copyEnvIfMissing(BACKEND_DIR, '.env.local', '.env.example');
  copyEnvIfMissing(FRONTEND_DIR, '.env.local', '.env.example');
  
  const rootEnv = path.join(MONOREPO_ROOT, '.env');
  const rootExample = path.join(MONOREPO_ROOT, '.env.example');
  copyEnvIfMissing(MONOREPO_ROOT, '.env', '.env.example');
  
  log('Variáveis de ambiente configuradas');
}

function installDependencies() {
  log('Instalando dependências com pnpm...');
  
  if (!fs.existsSync(path.join(MONOREPO_ROOT, 'pnpm-lock.yaml'))) {
    log('pnpm-lock.yaml não encontrado, rodando pnpm install...', 'warn');
  }
  
  return runCommand('pnpm install --frozen-lockfile', MONOREPO_ROOT, 'Instalando dependências');
}

function buildPackages() {
  log('Compilando pacotes...');
  return runCommand('pnpm run build', MONOREPO_ROOT, 'Build de todos os pacotes');
}

function startBackend() {
  return new Promise((resolve) => {
    log(`Iniciando backend na porta ${BACKEND_PORT}...`);
    
    backendProcess = spawn('pnpm', ['run', 'start:dev'], {
      cwd: BACKEND_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    
    backendProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Nest application successfully started') || 
          output.includes('Listening on') ||
          output.includes(`port ${BACKEND_PORT}`)) {
        log(`Backend rodando em http://localhost:${BACKEND_PORT}`, 'success');
        resolve();
      }
      process.stdout.write(`[BACKEND] ${output}`);
    });
    
    backendProcess.stderr?.on('data', (data) => {
      process.stderr.write(`[BACKEND] ${data}`);
    });
    
    backendProcess.on('error', (err) => {
      log(`Erro no backend: ${err.message}`, 'error');
      resolve();
    });
    
    setTimeout(() => {
      log('Backend iniciado (timeout)', 'warn');
      resolve();
    }, 30000);
  });
}

function startFrontend() {
  return new Promise((resolve) => {
    log(`Iniciando frontend na porta ${FRONTEND_PORT}...`);
    
    frontendProcess = spawn('pnpm', ['run', 'dev'], {
      cwd: FRONTEND_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1', PORT: String(FRONTEND_PORT) }
    });
    
    frontendProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('ready in') || output.includes(`port ${FRONTEND_PORT}`)) {
        log(`Frontend rodando em http://localhost:${FRONTEND_PORT}`, 'success');
        resolve();
      }
      process.stdout.write(`[FRONTEND] ${output}`);
    });
    
    frontendProcess.stderr?.on('data', (data) => {
      process.stderr.write(`[FRONTEND] ${data}`);
    });
    
    frontendProcess.on('error', (err) => {
      log(`Erro no frontend: ${err.message}`, 'error');
      resolve();
    });
    
    setTimeout(() => {
      log('Frontend iniciado (timeout)', 'warn');
      resolve();
    }, 30000);
  });
}

function openBrowser(url) {
  const platform = os.platform();
  let cmd;
  
  if (platform === 'darwin') cmd = 'open';
  else if (platform === 'win32') cmd = 'start';
  else cmd = 'xdg-open';
  
  try {
    execSync(`${cmd} "${url}"`, { stdio: 'ignore' });
    log(`Navegador aberto em ${url}`, 'success');
  } catch {
    log(`Abra manualmente: ${url}`, 'warn');
  }
}

function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  log('Encerrando processos...');
  
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
  
  if (frontendProcess) {
    frontendProcess.kill('SIGTERM');
    frontendProcess = null;
  }
  
  setTimeout(() => {
    if (backendProcess) backendProcess.kill('SIGKILL');
    if (frontendProcess) frontendProcess.kill('SIGKILL');
    process.exit(0);
  }, 5000);
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           ESTOQUE CRIS - LAUNCHER COMPLETO               ║
║     React 18 + NestJS + Neon PostgreSQL + Auth           ║
╚══════════════════════════════════════════════════════════╝
  `);
  
  if (!checkNodeVersion()) {
    log(`Node.js ${REQUIRED_NODE_VERSION}+ necessário. Atual: ${process.version}`, 'error');
    process.exit(1);
  }
  log(`Node.js ${process.version} ✓`);
  
  if (!fs.existsSync(path.join(MONOREPO_ROOT, 'pnpm-workspace.yaml'))) {
    log('Execute este script na raiz do monorepo', 'error');
    process.exit(1);
  }
  
  setupEnvironment();
  
  const shouldInstall = process.argv.includes('--install') || !fs.existsSync(path.join(MONOREPO_ROOT, 'node_modules'));
  if (shouldInstall) {
    if (!installDependencies()) process.exit(1);
  }
  
  if (process.argv.includes('--build')) {
    if (!buildPackages()) process.exit(1);
  }
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  await Promise.all([startBackend(), startFrontend()]);
  
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                    SISTEMA RODANDO                       ║
╠══════════════════════════════════════════════════════════╣
║  Frontend:  http://localhost:${FRONTEND_PORT}                          ║
║  Backend:   http://localhost:${BACKEND_PORT}                          ║
║  API Docs:  http://localhost:${BACKEND_PORT}/api/docs                ║
║  Health:    http://localhost:${BACKEND_PORT}/health/live             ║
╠══════════════════════════════════════════════════════════╣
║  Pressione Ctrl+C para parar tudo                        ║
╚══════════════════════════════════════════════════════════╝
  `);
  
  openBrowser(`http://localhost:${FRONTEND_PORT}`);
  
  await new Promise(() => {});
}

main().catch((err) => {
  log(`Erro fatal: ${err.message}`, 'error');
  cleanup();
  process.exit(1);
});