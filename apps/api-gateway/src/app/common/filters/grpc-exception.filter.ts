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
} from '@nestjs/common';
import { Response } from 'express';
import { status as GrpcStatus } from '@grpc/grpc-js';

@Injectable()
export class GrpcClientExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      return res
        .status(exception.getStatus())
        .json(exception.getResponse());
    }

    const code: number | undefined = exception?.code;
    const details: string = exception?.details || exception?.message || 'Internal server error';

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
        httpExc = new RequestTimeoutException(details);
        break;
      default:
        httpExc = new InternalServerErrorException(details);
        break;
    }

    return res.status(httpExc.getStatus()).json(httpExc.getResponse());
  }
}

