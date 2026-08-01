"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidatesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const candidates_service_1 = require("./candidates.service");
const candidates_controller_1 = require("./candidates.controller");
const candidate_entity_1 = require("./entities/candidate.entity");
const users_module_1 = require("../users/users.module");
const mail_module_1 = require("../mail/mail.module");
const gateway_module_1 = require("../gateway/gateway.module");
const assessments_module_1 = require("../assessments/assessments.module");
let CandidatesModule = class CandidatesModule {
};
exports.CandidatesModule = CandidatesModule;
exports.CandidatesModule = CandidatesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([candidate_entity_1.Candidate]),
            users_module_1.UsersModule,
            mail_module_1.MailModule,
            (0, common_1.forwardRef)(() => gateway_module_1.GatewayModule),
            (0, common_1.forwardRef)(() => assessments_module_1.AssessmentsModule),
        ],
        controllers: [candidates_controller_1.CandidatesController],
        providers: [candidates_service_1.CandidatesService],
        exports: [candidates_service_1.CandidatesService],
    })
], CandidatesModule);
//# sourceMappingURL=candidates.module.js.map