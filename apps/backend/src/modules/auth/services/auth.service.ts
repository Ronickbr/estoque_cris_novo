import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { User, UserRole } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { PasswordPolicyService } from './password-policy.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ChangeEmailDto } from '../dto/change-email.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from '../dto/reset-password.dto';
import {
  AuthResponseDto,
  RefreshTokenResponseDto,
  UserResponseDto,
  PasswordPolicyResponseDto,
} from '../dto/auth-response.dto';

// Dynamic imports for ESM modules
let neonAuthModule: any;
let supabaseAdapterModule: any;

async function loadNeonAuth() {
  if (!neonAuthModule) {
    neonAuthModule = await import('@neon/auth');
  }
  if (!supabaseAdapterModule) {
    supabaseAdapterModule = require('@neon/auth/vanilla/adapters');
  }
  return { neonAuthModule, supabaseAdapterModule };
}

@Injectable()
export class AuthService {
  private readonly maxLoginAttempts = 5;
  private readonly lockoutTimeMs = 15 * 60 * 1000; // 15 minutes
  private loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
  private neonAuthClient: any;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private passwordPolicy: PasswordPolicyService,
    private configService: ConfigService
  ) {
    this.initializeNeonAuth();
  }

  private async initializeNeonAuth(): Promise<void> {
    const authUrl = this.configService.get<string>('NEON_AUTH_BASE_URL');
    if (!authUrl) {
      throw new Error('NEON_AUTH_BASE_URL is not configured');
    }
    const { neonAuthModule, supabaseAdapterModule } = await loadNeonAuth();
    this.neonAuthClient = neonAuthModule.createAuthClient(authUrl, {
      adapter: supabaseAdapterModule.SupabaseAuthAdapter(),
    });
  }

  private async ensureClient(): Promise<any> {
    if (!this.neonAuthClient) {
      await this.initializeNeonAuth();
    }
    return this.neonAuthClient;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { identifier, password } = loginDto;

    // Check rate limiting
    this.checkRateLimit(identifier);

    const client = await this.ensureClient();

    // Authenticate with Neon Auth using email/password
    const { data, error } = await client.signInWithPassword({
      email: identifier,
      password: password,
    });

    if (error) {
      this.recordFailedAttempt(identifier);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.clearFailedAttempts(identifier);

    // Get the access token from Neon Auth
    const accessToken = await client.getJWTToken();
    
    // Find or create local user
    let user = await this.userRepository.findOne({ where: { email: identifier } });
    
    if (!user) {
      // User authenticated with Neon Auth but doesn't exist locally
      // Create local user record
      user = await this.createLocalUserFromNeonAuth(data.user);
    }

    return {
      accessToken: accessToken || '',
      user: this.toUserResponse(user),
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Validate password policy
    const passwordValidation = this.passwordPolicy.validate(registerDto.senha);
    if (!passwordValidation.valid) {
      throw new BadRequestException({
        message: 'Senha não atende à política de segurança',
        errors: passwordValidation.errors,
      });
    }

    // Check if user already exists locally
    const existingUser = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { nome: registerDto.nome }],
    });

    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw new ConflictException('Nome de usuário já existe');
    }

    const client = await this.ensureClient();

    // Register with Neon Auth
    const { data, error } = await client.signUp({
      email: registerDto.email,
      password: registerDto.senha,
      options: {
        data: {
          name: registerDto.nome,
          role: registerDto.nivel,
        },
      },
    });

    if (error) {
      throw new BadRequestException({
        message: 'Erro ao criar usuário no Neon Auth',
        errors: [error.message],
      });
    }

    // Create local user
    const user = await this.createLocalUserFromNeonAuth(data.user);
    
    const accessToken = await client.getJWTToken();

    return {
      accessToken: accessToken || '',
      user: this.toUserResponse(user),
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const client = await this.ensureClient();

    // Update password in Neon Auth
    const { error } = await client.updateUser({
      password: changePasswordDto.novaSenha,
    });

    if (error) {
      throw new BadRequestException({
        message: 'Erro ao atualizar senha no Neon Auth',
        errors: [error.message],
      });
    }

    // Also update local password (hashed by @BeforeUpdate)
    user.senha = changePasswordDto.novaSenha;
    await this.userRepository.save(user);
  }

  async changeEmail(userId: number, changeEmailDto: ChangeEmailDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Validate emails match
    if (changeEmailDto.novoEmail !== changeEmailDto.confirmarNovoEmail) {
      throw new BadRequestException('E-mails não conferem');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: changeEmailDto.novoEmail },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const client = await this.ensureClient();

    // Update email in Neon Auth
    const { error } = await client.updateUser({
      email: changeEmailDto.novoEmail,
    });

    if (error) {
      throw new BadRequestException({
        message: 'Erro ao atualizar email no Neon Auth',
        errors: [error.message],
      });
    }

    // Update local email
    user.email = changeEmailDto.novoEmail;
    await this.userRepository.save(user);
  }

  async updateProfile(
    userId: number,
    data: { nome: string; email: string }
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Check if email already exists for another user
    if (data.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('E-mail já cadastrado');
      }
    }

    // Check if name already exists for another user
    if (data.nome !== user.nome) {
      const existingUser = await this.userRepository.findOne({
        where: { nome: data.nome },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Nome de usuário já existe');
      }
    }

    const client = await this.ensureClient();

    // Update in Neon Auth if email changed
    if (data.email !== user.email) {
      const { error } = await client.updateUser({
        email: data.email,
        data: { name: data.nome },
      });

      if (error) {
        throw new BadRequestException({
          message: 'Erro ao atualizar perfil no Neon Auth',
          errors: [error.message],
        });
      }
    }

    user.nome = data.nome;
    user.email = data.email;
    await this.userRepository.save(user);

    return this.toUserResponse(user);
  }

  async requestPasswordReset(requestDto: RequestPasswordResetDto): Promise<void> {
    const client = await this.ensureClient();

    // Use Neon Auth's password reset
    const { error } = await client.resetPasswordForEmail(requestDto.email, {
      redirectTo: this.configService.get<string>('PASSWORD_RESET_REDIRECT_URL', 'http://localhost:3000/reset-password'),
    });

    if (error) {
      // Don't reveal if email exists
      return;
    }
  }

  async resetPassword(resetDto: ResetPasswordDto): Promise<void> {
    if (resetDto.novaSenha !== resetDto.confirmarNovaSenha) {
      throw new BadRequestException('Senhas não conferem');
    }

    const passwordValidation = this.passwordPolicy.validate(resetDto.novaSenha);
    if (!passwordValidation.valid) {
      throw new BadRequestException({
        message: 'Nova senha não atende à política de segurança',
        errors: passwordValidation.errors,
      });
    }

    // Use Neon Auth's password update with token
    // The token would be in the URL from the reset email
    // For API-based reset, we need the session/token from the email link
    // This is typically handled client-side, but we can provide an endpoint
    
    // For now, throw not implemented as this requires the session token from email
    throw new BadRequestException('Reset de senha via token deve ser feito através do link enviado por email');
  }

  async refreshToken(userId: number): Promise<RefreshTokenResponseDto> {
    // Neon Auth handles token refresh automatically via getJWTToken
    // This endpoint might not be needed with Neon Auth
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const client = await this.ensureClient();
    const accessToken = await client.getJWTToken();

    return { accessToken: accessToken || '' };
  }

  async validateUser(userId: number): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user ? this.toUserResponse(user) : null;
  }

  private async createLocalUserFromNeonAuth(neonUser: any): Promise<User> {
    // Map Neon Auth user to local User entity
    const user = this.userRepository.create({
      nome: neonUser.user_metadata?.name || neonUser.email?.split('@')[0] || 'user',
      email: neonUser.email,
      senha: crypto.randomBytes(32).toString('hex'), // Random password, auth is via Neon Auth
      nivel: (neonUser.user_metadata?.role as UserRole) || UserRole.USER,
    });

    return this.userRepository.save(user);
  }

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      nivel: user.nivel,
    };
  }

  private checkRateLimit(identifier: string): void {
    const key = `login_${crypto.createHash('sha256').update(identifier).digest('hex')}`;
    const attempts = this.loginAttempts.get(key);

    if (attempts && attempts.count >= this.maxLoginAttempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      if (timeSinceLastAttempt < this.lockoutTimeMs) {
        const remaining = Math.ceil((this.lockoutTimeMs - timeSinceLastAttempt) / 1000);
        throw new BadRequestException(
          `Muitas tentativas de login. Tente novamente em ${remaining} segundos.`
        );
      } else {
        // Lockout expired, reset
        this.loginAttempts.delete(key);
      }
    }
  }

  private recordFailedAttempt(identifier: string): void {
    const key = `login_${crypto.createHash('sha256').update(identifier).digest('hex')}`;
    const attempts = this.loginAttempts.get(key) || { count: 0, lastAttempt: 0 };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(key, attempts);
  }

  private clearFailedAttempts(identifier: string): void {
    const key = `login_${crypto.createHash('sha256').update(identifier).digest('hex')}`;
    this.loginAttempts.delete(key);
  }

  getPasswordPolicy(): PasswordPolicyResponseDto {
    return this.passwordPolicy.getPolicy();
  }
}