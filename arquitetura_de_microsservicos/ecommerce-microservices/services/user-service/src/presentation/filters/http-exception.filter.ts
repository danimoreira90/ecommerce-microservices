import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : (exception as Error & { statusCode?: number })?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : (exception as Error)?.message ?? 'Internal server error';

    this.logger.warn(`Request failed: ${req.method} ${req.url} ${status}`, {
      correlationId: req.headers['x-correlation-id'],
      message,
    });

    res.status(status).json({
      statusCode: status,
      message,
      correlationId: req.headers['x-correlation-id'],
    });
  }
}
