"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisIoAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
class RedisIoAdapter extends platform_socket_io_1.IoAdapter {
    constructor(app, configService) {
        super(app);
        this.configService = configService;
    }
    async connectToRedis() {
        const host = this.configService.get('REDIS_HOST', 'localhost');
        const port = this.configService.get('REDIS_PORT', 6379);
        const password = this.configService.get('REDIS_PASSWORD');
        const db = this.configService.get('REDIS_DB', 0);
        const pubClient = new ioredis_1.default({
            host,
            port,
            password,
            db,
            maxRetriesPerRequest: null,
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });
        pubClient.on('error', (err) => {
            console.error('Redis PubClient Error:', err);
        });
        const subClient = pubClient.duplicate();
        subClient.on('error', (err) => {
            console.error('Redis SubClient Error:', err);
        });
        this.adapterConstructor = (0, redis_adapter_1.createAdapter)(pubClient, subClient);
    }
    createIOServer(port, options) {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }
}
exports.RedisIoAdapter = RedisIoAdapter;
//# sourceMappingURL=redis-io.adapter.js.map