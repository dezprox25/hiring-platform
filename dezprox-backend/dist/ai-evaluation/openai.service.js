"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
let OpenAiService = class OpenAiService {
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (!apiKey || apiKey === 'sk-xxxx') {
            console.warn('OPENAI_API_KEY is missing or using default. AI Evaluation features will be disabled.');
            return;
        }
        this.openai = new openai_1.default({
            apiKey,
        });
    }
    async evaluate(systemPrompt, userMessage) {
        if (!this.openai) {
            throw new common_1.InternalServerErrorException('OpenAI service is not configured. Please set a valid OPENAI_API_KEY.');
        }
        try {
            const model = this.configService.get('OPENAI_MODEL', 'gpt-4');
            const response = await this.openai.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0,
            });
            let content = response.choices[0].message.content || '';
            content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            try {
                const parsed = JSON.parse(content);
                const validRecommendations = ['hire', 'reject', 'hold'];
                if (!validRecommendations.includes(parsed.recommendation)) {
                    throw new Error(`Invalid recommendation: ${parsed.recommendation}`);
                }
                return parsed;
            }
            catch (err) {
                throw new common_1.InternalServerErrorException('AI service returned malformed JSON');
            }
        }
        catch (err) {
            if (err instanceof common_1.InternalServerErrorException)
                throw err;
            const message = err instanceof Error ? err.message : 'Unknown error';
            throw new common_1.InternalServerErrorException(`OpenAI Error: ${message}`);
        }
    }
};
exports.OpenAiService = OpenAiService;
exports.OpenAiService = OpenAiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenAiService);
//# sourceMappingURL=openai.service.js.map