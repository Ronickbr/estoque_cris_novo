import { ConfigService } from '@nestjs/config';

export const jwtConfig = (configService: ConfigService) => ({
  secret: configService.get<string>('JWT_SECRET', 'default-secret-change-me'),
  signOptions: {
    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
  },
  verifyOptions: {
    ignoreExpiration: false,
  },
});
