import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger('MetricsInterceptor');

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = httpContext.getResponse();
        const statusCode = response.statusCode;
        const duration = (Date.now() - now) / 1000;

        // Update Prometheus metrics
        this.metricsService.httpRequestsTotal.inc({
          method,
          route: url,
          status: statusCode.toString(),
        });

        this.metricsService.httpRequestDuration.observe(
          { method, route: url },
          duration,
        );

        if (duration > 1) {
          this.logger.warn(`Slow request: ${method} ${url} took ${duration}s`);
        }
      }),
    );
  }
}
