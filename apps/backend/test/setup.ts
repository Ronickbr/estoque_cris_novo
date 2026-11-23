import 'reflect-metadata';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PASSWORD_MIN_LENGTH = '8';
process.env.PASSWORD_REQUIRE_UPPERCASE = 'true';
process.env.PASSWORD_REQUIRE_LOWERCASE = 'true';
process.env.PASSWORD_REQUIRE_NUMBERS = 'true';
process.env.PASSWORD_REQUIRE_SYMBOLS = 'true';
process.env.UPLOAD_DEST = './test-uploads';
process.env.BACKUP_DIR = './test-backups';
process.env.LOG_LEVEL = 'error';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
