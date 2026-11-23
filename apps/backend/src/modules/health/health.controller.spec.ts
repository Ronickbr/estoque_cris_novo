import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  const mockDataSource = {
    isInitialized: true,
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        DATABASE_SSL: false,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health status', async () => {
      const result = await controller.check();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('memory');
      expect(result.checks).toHaveProperty('disk');
    });
  });

  describe('ready', () => {
    it('should return ready status', async () => {
      const result = await controller.ready();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('database');
    });
  });

  describe('live', () => {
    it('should return live status', async () => {
      const result = await controller.live();
      expect(result).toHaveProperty('status', 'alive');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
    });
  });
});

describe('HealthService', () => {
  let service: HealthService;

  const mockDataSource = {
    isInitialized: true,
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        DATABASE_SSL: false,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkDatabase', () => {
    it('should return ok when database is connected', async () => {
      const result = await service['checkDatabase']();
      expect(result).toEqual({ status: 'ok', message: 'Database connection successful' });
    });

    it('should return error when database is not initialized', async () => {
      const uninitializedDataSource = { isInitialized: false, query: jest.fn() };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthService,
          { provide: DataSource, useValue: uninitializedDataSource },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const uninitializedService = module.get<HealthService>(HealthService);
      const result = await uninitializedService['checkDatabase']();
      expect(result.status).toBe('error');
    });
  });

  describe('checkMemory', () => {
    it('should return memory info', async () => {
      const result = await service['checkMemory']();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('used');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('percentage');
    });
  });
});
