import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} ${response.statusCode} ${delay}ms - ${userAgent}`,
          );
        },
        error: (err) => {
          const delay = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} ${err.status || 500} ${delay}ms - ${userAgent}`,
          );
        },
      }),
    );
  }
}
