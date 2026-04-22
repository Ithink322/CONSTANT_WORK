import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? payload.message
        : exception instanceof Error
          ? exception.message
          : "Internal server error";

    const details =
      typeof payload === "object" && payload !== null && "details" in payload
        ? payload.details
        : undefined;

    response.status(status).json({
      error: {
        code: status,
        message,
        details,
        timestamp: new Date().toISOString(),
        path: request.url
      }
    });
  }
}
