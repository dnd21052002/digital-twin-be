import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponse } from './api-error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : undefined;
    const extracted = this.extractError(exception, exceptionResponse, status);
    const body: ApiErrorResponse = {
      error: {
        code: extracted.code,
        message: extracted.message,
        ...(extracted.details === undefined ? {} : { details: extracted.details }),
      },
    };
    response.status(status).json(body);
  }

  private extractError(exception: unknown, exceptionResponse: unknown, status: number): { code: string; message: string; details?: unknown } {
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObject = exceptionResponse as { code?: unknown; message?: unknown; error?: unknown };
      const explicitCode = typeof responseObject.code === 'string' ? responseObject.code : undefined;

      if (Array.isArray(responseObject.message)) {
        return { code: explicitCode ?? 'validation_failed', message: 'Validation failed', details: responseObject.message };
      }

      if (responseObject.message !== undefined) {
        return { code: explicitCode ?? this.codeFromStatus(status), message: String(responseObject.message) };
      }
    }

    if (typeof exceptionResponse === 'string') {
      return { code: this.codeFromStatus(status), message: exceptionResponse };
    }

    if (exception instanceof Error) {
      return { code: this.codeFromStatus(status), message: exception.message };
    }

    return { code: this.codeFromStatus(status), message: 'Internal server error' };
  }

  private codeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'invalid_request';
      case HttpStatus.UNAUTHORIZED:
        return 'unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'permission_denied';
      case HttpStatus.NOT_FOUND:
        return 'not_found';
      case HttpStatus.CONFLICT:
        return 'conflict';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'rate_limited';
      default:
        return 'internal_error';
    }
  }
}
