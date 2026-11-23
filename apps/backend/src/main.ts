import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable for API
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: configService.get<boolean>('CORS_CREDENTIALS', true),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: configService.get<string>('NODE_ENV') === 'production',
      validationError: {
        target: false,
        value: false,
      },
    })
  );

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger documentation
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE', 'Estoque Cris API'))
      .setDescription(
        configService.get<string>(
          'SWAGGER_DESCRIPTION',
          'API do Sistema de Gerenciamento de Estoque'
        )
      )
      .setVersion(configService.get<string>('SWAGGER_VERSION', '2.0.0'))
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
      .addTag('auth', 'Autenticação e autorização')
      .addTag('users', 'Gerenciamento de usuários')
      .addTag('manufacturers', 'Gerenciamento de fabricantes')
      .addTag('products', 'Gerenciamento de produtos')
      .addTag('inventory-movements', 'Movimentações de estoque')
      .addTag('reports', 'Relatórios e exportações')
      .addTag('backup', 'Backup e restauração')
      .addTag('uploads', 'Upload de arquivos')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(configService.get<string>('SWAGGER_PATH', 'api/docs'), app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 Application running on: http://localhost:${port}/${apiPrefix}`);
  console.log(
    `📚 Swagger docs: http://localhost:${port}/${configService.get<string>('SWAGGER_PATH', 'api/docs')}`
  );
}

bootstrap();
