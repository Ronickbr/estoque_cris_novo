import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto, PaginatedUsersResponseDto } from './dto/user-response.dto';
import { AuthService } from '../auth/services/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService
  ) {}

  async findAll(page = 1, perPage = 20): Promise<PaginatedUsersResponseDto> {
    const [data, total] = await this.userRepository.findAndCount({
      order: { criadoEm: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      data: data.map((user) => this.toResponseDto(user)),
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage),
    };
  }

  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return this.toResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByName(nome: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { nome } });
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Validate password policy
    const passwordValidation = this.authService.getPasswordPolicy();
    const validation = await this.validatePasswordStrength(createUserDto.senha);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Senha não atende à política de segurança',
        errors: validation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email: createUserDto.email }, { nome: createUserDto.nome }],
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw new ConflictException('Nome de usuário já existe');
    }

    const user = this.userRepository.create({
      nome: createUserDto.nome,
      email: createUserDto.email,
      senha: createUserDto.senha, // Will be hashed by @BeforeInsert
      nivel: createUserDto.nivel,
    });

    const savedUser = await this.userRepository.save(user);
    return this.toResponseDto(savedUser);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Check if email already exists for another user
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('E-mail já cadastrado');
      }
    }

    // Check if name already exists for another user
    if (updateUserDto.nome && updateUserDto.nome !== user.nome) {
      const existingUser = await this.userRepository.findOne({
        where: { nome: updateUserDto.nome },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Nome de usuário já existe');
      }
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    return this.toResponseDto(user);
  }

  async delete(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Prevent deleting the last admin
    if (user.nivel === UserRole.ADMIN) {
      const adminCount = await this.userRepository.count({
        where: { nivel: UserRole.ADMIN },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Não é possível excluir o último administrador');
      }
    }

    await this.userRepository.remove(user);
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    user.senha = newPassword; // Will be hashed by @BeforeUpdate
    await this.userRepository.save(user);
  }

  private async validatePasswordStrength(
    password: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const policy = this.authService.getPasswordPolicy();
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(`Mínimo ${policy.minLength} caracteres`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Pelo menos 1 letra maiúscula');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Pelo menos 1 letra minúscula');
    }

    if (policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Pelo menos 1 número');
    }

    if (policy.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Pelo menos 1 símbolo (!@#$%^&*)');
    }

    return { valid: errors.length === 0, errors };
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      nivel: user.nivel,
      criadoEm: user.criadoEm,
      atualizadoEm: user.atualizadoEm,
    };
  }
}
