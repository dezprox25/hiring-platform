import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  
  public readonly httpRequestsTotal: Counter<string>;
  public readonly httpRequestDuration: Histogram<string>;
  public readonly activeConnections: Gauge<string>;
  public readonly authFailuresTotal: Counter<string>;
  public readonly websocketEventsTotal: Counter<string>;
  public readonly aiEvaluationDuration: Histogram<string>;

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({
      app: 'dezprox-backend',
    });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5],
      registers: [this.registry],
    });

    this.activeConnections = new Gauge({
      name: 'websocket_active_connections',
      help: 'Number of active WebSocket connections',
      registers: [this.registry],
    });

    this.authFailuresTotal = new Counter({
      name: 'auth_failures_total',
      help: 'Total number of authentication failures',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.websocketEventsTotal = new Counter({
      name: 'websocket_events_total',
      help: 'Total number of WebSocket events',
      labelNames: ['event', 'type'], // type: 'in' or 'out'
      registers: [this.registry],
    });

    this.aiEvaluationDuration = new Histogram({
      name: 'ai_evaluation_duration_seconds',
      help: 'Duration of AI evaluations in seconds',
      buckets: [5, 10, 20, 30, 60, 120],
      registers: [this.registry],
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
