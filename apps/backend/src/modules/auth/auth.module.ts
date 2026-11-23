import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordPolicyService } from './services/password-policy.service';
import { NeonAuthStrategy } from './strategies/neon-auth.strategy';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'neon-auth' }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordPolicyService, NeonAuthStrategy],
  exports: [AuthService, PasswordPolicyService],
})
export class AuthModule {}
