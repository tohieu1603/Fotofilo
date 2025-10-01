import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Response } from 'express';
import { status as GrpcStatus } from '@grpc/grpc-js';

@Injectable()
export class GrpcClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GrpcClientExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse<Response>();

    // Log the original exception for debugging
    this.logger.error(`gRPC Exception: ${exception.message}`, {
      code: exception?.code,
      details: exception?.details,
      metadata: exception?.metadata,
      path: req.url,
      method: req.method,
    });

    if (exception instanceof HttpException) {
      return res
        .status(exception.getStatus())
        .json({
          success: false,
          message: exception.message,
          error: exception.getResponse(),
          statusCode: exception.getStatus(),
          timestamp: new Date().toISOString(),
          path: req.url,
        });
    }

    const code: number | undefined = exception?.code;
    const details: string = exception?.details || exception?.message || 'Internal server error';

    // Try to parse structured error details if available
    let errorDetails = null;
    try {
      if (exception?.details && typeof exception.details === 'string') {
        errorDetails = JSON.parse(exception.details);
      }
    } catch {
      // Ignore parsing errors
    }

    let httpExc: HttpException;
    switch (code) {
      case GrpcStatus.INVALID_ARGUMENT:
        httpExc = new BadRequestException(details);
        break;
      case GrpcStatus.NOT_FOUND:
        httpExc = new NotFoundException(details);
        break;
      case GrpcStatus.ALREADY_EXISTS:
        httpExc = new ConflictException(details);
        break;
      case GrpcStatus.PERMISSION_DENIED:
        httpExc = new ForbiddenException(details);
        break;
      case GrpcStatus.UNAUTHENTICATED:
        httpExc = new UnauthorizedException(details);
        break;
      case GrpcStatus.DEADLINE_EXCEEDED:
        httpExc = new RequestTimeoutException(details);
        break;
      case GrpcStatus.UNAVAILABLE:
        httpExc = new ServiceUnavailableException('Service temporarily unavailable');
        break;
      case GrpcStatus.FAILED_PRECONDITION:
        httpExc = new ConflictException(details);
        break;
      case GrpcStatus.OUT_OF_RANGE:
        httpExc = new BadRequestException(details);
        break;
      case GrpcStatus.UNIMPLEMENTED:
        httpExc = new InternalServerErrorException('Service method not implemented');
        break;
      case GrpcStatus.INTERNAL:
        httpExc = new InternalServerErrorException('Internal service error');
        break;
      case GrpcStatus.DATA_LOSS:
        httpExc = new InternalServerErrorException('Data corruption detected');
        break;
      default:
        httpExc = new InternalServerErrorException('Unknown service error');
        break;
    }

    const response = {
      success: false,
      message: details,
      statusCode: httpExc.getStatus(),
      timestamp: new Date().toISOString(),
      path: req.url,
      ...(errorDetails && { details: errorDetails }),
    };

    return res.status(httpExc.getStatus()).json(response);
  }
}

