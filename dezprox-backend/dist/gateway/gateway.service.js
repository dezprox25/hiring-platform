"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayService = void 0;
const common_1 = require("@nestjs/common");
const assessment_status_enum_1 = require("../assessments/enums/assessment-status.enum");
const assessment_constants_1 = require("../assessments/assessment.constants");
let GatewayService = class GatewayService {
    getRoundStartedAt(assessment, round) {
        switch (round) {
            case assessment_status_enum_1.AssessmentStatus.ROUND_1:
                return assessment.startedAt;
            case assessment_status_enum_1.AssessmentStatus.ROUND_2:
                return assessment.round2StartedAt;
            case assessment_status_enum_1.AssessmentStatus.ROUND_3:
                return assessment.round3StartedAt;
            default:
                return null;
        }
    }
    getSecondsRemaining(assessment) {
        const round = assessment.status;
        const roundStartedAt = this.getRoundStartedAt(assessment, round);
        if (!roundStartedAt) {
            return 0;
        }
        let durationMinutes = 0;
        switch (round) {
            case assessment_status_enum_1.AssessmentStatus.ROUND_1:
                durationMinutes = assessment_constants_1.ASSESSMENT_ROUND_DURATIONS.mcq;
                break;
            case assessment_status_enum_1.AssessmentStatus.ROUND_2:
                durationMinutes = assessment_constants_1.ASSESSMENT_ROUND_DURATIONS.typing;
                break;
            case assessment_status_enum_1.AssessmentStatus.ROUND_3:
                durationMinutes = assessment_constants_1.ASSESSMENT_ROUND_DURATIONS.coding;
                break;
        }
        const durationSeconds = durationMinutes * 60;
        const elapsedSeconds = Math.floor((Date.now() - roundStartedAt.getTime()) / 1000);
        const secondsRemaining = durationSeconds - elapsedSeconds;
        return Math.max(0, secondsRemaining);
    }
    isTimeUp(assessment) {
        return this.getSecondsRemaining(assessment) <= 0;
    }
};
exports.GatewayService = GatewayService;
exports.GatewayService = GatewayService = __decorate([
    (0, common_1.Injectable)()
], GatewayService);
//# sourceMappingURL=gateway.service.js.map