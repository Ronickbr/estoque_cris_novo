import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './services/auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import {
  AuthResponseDto,
  RefreshTokenResponseDto,
  UserResponseDto,
  PasswordPolicyResponseDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '@/modules/users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas de login' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo usuário (apenas admin)' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou senha fraca' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 409, description: 'Usuário ou email já existe' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acesso' })
  @ApiResponse({ status: 200, description: 'Token renovado', type: RefreshTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  async refresh(@CurrentUser() user: User): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do usuário logado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async me(@CurrentUser() user: User): Promise<UserResponseDto> {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      nivel: user.nivel,
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alterar senha do usuário logado' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou senha fraca' })
  @ApiResponse({ status: 401, description: 'Senha atual incorreta' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    await this.authService.changePassword(user.id, changePasswordDto);
    return { message: 'Senha alterada com sucesso!' };
  }

  @Post('change-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alterar email do usuário logado' })
  @ApiResponse({ status: 200, description: 'Email alterado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Senha incorreta' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async changeEmail(
    @CurrentUser() user: User,
    @Body() changeEmailDto: ChangeEmailDto
  ): Promise<{ message: string }> {
    await this.authService.changeEmail(user.id, changeEmailDto);
    return { message: 'Email alterado com sucesso!' };
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Nome ou email já existe' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() data: { nome: string; email: string }
  ): Promise<UserResponseDto> {
    return this.authService.updateProfile(user.id, data);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar reset de senha' })
  @ApiResponse({ status: 200, description: 'Se o email existir, instruções serão enviadas' })
  async forgotPassword(@Body() requestDto: RequestPasswordResetDto): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(requestDto);
    return { message: 'Se o email estiver cadastrado, instruções de reset serão enviadas.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetar senha com token' })
  @ApiResponse({ status: 200, description: 'Senha resetada com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido, expirado ou senha fraca' })
  async resetPassword(@Body() resetDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(resetDto);
    return { message: 'Senha resetada com sucesso!' };
  }

  @Get('password-policy')
  @ApiOperation({ summary: 'Obter política de senhas' })
  @ApiResponse({ status: 200, description: 'Política de senhas', type: PasswordPolicyResponseDto })
  getPasswordPolicy(): PasswordPolicyResponseDto {
    return this.authService.getPasswordPolicy();
  }
}
