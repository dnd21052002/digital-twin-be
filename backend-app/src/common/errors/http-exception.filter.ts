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
    const extracted = this.extractMessageAndDetails(exception, exceptionResponse);
    const body: ApiErrorResponse = {
      error: {
        code: this.codeFromStatus(status),
        message: extracted.message,
        ...(extracted.details === undefined ? {} : { details: extracted.details }),
      },
    };
    response.status(status).json(body);
  }

  private extractMessageAndDetails(exception: unknown, exceptionResponse: unknown): { message: string; details?: unknown } {
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
      const responseMessage = (exceptionResponse as { message: unknown }).message;
      if (Array.isArray(responseMessage)) {
        return { message: 'Validation failed', details: responseMessage };
      }
      return { message: String(responseMessage) };
    }

    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    if (exception instanceof Error) {
      return { message: exception.message };
    }

    return { message: 'Internal server error' };
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
