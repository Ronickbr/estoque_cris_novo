import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordPolicyResponseDto } from '../dto/password-policy.dto';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class PasswordPolicyService {
  constructor(private configService: ConfigService) {}

  validate(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const minLength = this.configService.get<number>('PASSWORD_MIN_LENGTH', 8);
    const requireUppercase = this.configService.get<boolean>('PASSWORD_REQUIRE_UPPERCASE', true);
    const requireLowercase = this.configService.get<boolean>('PASSWORD_REQUIRE_LOWERCASE', true);
    const requireNumbers = this.configService.get<boolean>('PASSWORD_REQUIRE_NUMBERS', true);
    const requireSymbols = this.configService.get<boolean>('PASSWORD_REQUIRE_SYMBOLS', true);

    if (password.length < minLength) {
      errors.push(`Mínimo ${minLength} caracteres`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Pelo menos 1 letra maiúscula');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Pelo menos 1 letra minúscula');
    }

    if (requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Pelo menos 1 número');
    }

    if (requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Pelo menos 1 símbolo (!@#$%^&*)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getPolicy(): PasswordPolicyResponseDto {
    const minLength = this.configService.get<number>('PASSWORD_MIN_LENGTH', 8);
    const requireUppercase = this.configService.get<boolean>('PASSWORD_REQUIRE_UPPERCASE', true);
    const requireLowercase = this.configService.get<boolean>('PASSWORD_REQUIRE_LOWERCASE', true);
    const requireNumbers = this.configService.get<boolean>('PASSWORD_REQUIRE_NUMBERS', true);
    const requireSymbols = this.configService.get<boolean>('PASSWORD_REQUIRE_SYMBOLS', true);

    const rules: string[] = [`Mínimo ${minLength} caracteres`];

    if (requireUppercase) rules.push('Pelo menos 1 letra maiúscula');
    if (requireLowercase) rules.push('Pelo menos 1 letra minúscula');
    if (requireNumbers) rules.push('Pelo menos 1 número');
    if (requireSymbols) rules.push('Pelo menos 1 símbolo (!@#$%^&*)');

    return {
      minLength,
      requireUppercase,
      requireLowercase,
      requireNumbers,
      requireSymbols,
      rules,
    };
  }
}
