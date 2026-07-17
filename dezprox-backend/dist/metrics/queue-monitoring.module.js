"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueMonitoringModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_1 = require("@bull-board/nestjs");
const express_1 = require("@bull-board/express");
const bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
let QueueMonitoringModule = class QueueMonitoringModule {
};
exports.QueueMonitoringModule = QueueMonitoringModule;
exports.QueueMonitoringModule = QueueMonitoringModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_1.BullBoardModule.forRoot({
                route: '/queues',
                adapter: express_1.ExpressAdapter,
            }),
            nestjs_1.BullBoardModule.forFeature({
                name: 'ai-evaluation',
                adapter: bullMQAdapter_1.BullMQAdapter,
            }),
        ],
    })
], QueueMonitoringModule);
//# sourceMappingURL=queue-monitoring.module.js.map