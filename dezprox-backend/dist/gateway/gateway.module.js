"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bullmq_1 = require("@nestjs/bullmq");
const assessments_module_1 = require("../assessments/assessments.module");
const assessment_gateway_1 = require("./assessment.gateway");
const gateway_service_1 = require("./gateway.service");
const timer_processor_1 = require("./timer.processor");
let GatewayModule = class GatewayModule {
};
exports.GatewayModule = GatewayModule;
exports.GatewayModule = GatewayModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule,
            bullmq_1.BullModule.registerQueue({
                name: 'assessment-timer',
            }),
            assessments_module_1.AssessmentsModule,
        ],
        providers: [assessment_gateway_1.AssessmentGateway, gateway_service_1.GatewayService, timer_processor_1.TimerProcessor],
        exports: [assessment_gateway_1.AssessmentGateway],
    })
], GatewayModule);
//# sourceMappingURL=gateway.module.js.map