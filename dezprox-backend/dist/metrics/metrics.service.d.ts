import { Counter, Gauge, Histogram } from 'prom-client';
export declare class MetricsService {
    private readonly registry;
    readonly httpRequestsTotal: Counter<string>;
    readonly httpRequestDuration: Histogram<string>;
    readonly activeConnections: Gauge<string>;
    readonly authFailuresTotal: Counter<string>;
    readonly websocketEventsTotal: Counter<string>;
    readonly aiEvaluationDuration: Histogram<string>;
    constructor();
    getMetrics(): Promise<string>;
}
