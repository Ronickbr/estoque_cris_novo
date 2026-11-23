import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as any;
        message = resp.message || exception.message;
        errors = Array.isArray(resp.message) ? resp.message : [resp.message || exception.message];
      } else {
        message = exceptionResponse as string;
        errors = [message];
      }
    } else if (exception instanceof QueryFailedError) {
      // Database errors
      status = HttpStatus.BAD_REQUEST;
      message = 'Erro de validação de dados';

      // Handle unique constraint violations
      if (
        exception.message.includes('duplicate key') ||
        exception.message.includes('unique constraint')
      ) {
        if (
          exception.message.includes('uk_usuarios_email') ||
          exception.message.includes('users_email_key')
        ) {
          errors = ['E-mail já cadastrado'];
        } else if (
          exception.message.includes('uk_usuarios_nome') ||
          exception.message.includes('users_name_key')
        ) {
          errors = ['Nome de usuário já existe'];
        } else if (
          exception.message.includes('uk_manufacturers_name') ||
          exception.message.includes('manufacturers_name_key')
        ) {
          errors = ['Fabricante com este nome já existe'];
        } else {
          errors = ['Registro duplicado'];
        }
      } else if (exception.message.includes('foreign key')) {
        errors = ['Referência inválida: registro relacionado não encontrado'];
      } else if (
        exception.message.includes('check constraint') ||
        exception.message.includes('Estoque insuficiente')
      ) {
        errors = ['Estoque insuficiente para esta operação'];
      } else {
        errors = ['Erro de integridade dos dados'];
      }
    } else if (exception instanceof Error) {
      this.logger.error(`${request.method} ${request.url}`, exception.stack);
      message = exception.message;
      errors = [message];
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errors: errors.length > 0 ? errors : undefined,
    };

    // Log error for debugging
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception)
      );
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} - ${status}: ${message}`);
    }

    response.status(status).json(errorResponse);
  }
}
