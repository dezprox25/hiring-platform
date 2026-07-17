import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CandidateStatus } from './enums/candidate-status.enum';
export declare class CandidatesController {
    private readonly candidatesService;
    constructor(candidatesService: CandidatesService);
    create(createCandidateDto: CreateCandidateDto, user: JwtPayload): Promise<import("./candidates.service").CandidateResponse>;
    resendInvite(id: string): Promise<void>;
    findAll(status?: CandidateStatus, roleApplied?: string, search?: string, page?: string, limit?: string, user?: JwtPayload): Promise<{
        data: import("./candidates.service").CandidateResponse[];
        total: number;
    }>;
    findMe(user: JwtPayload): Promise<import("./candidates.service").CandidateResponse>;
    getMyAssessment(user: JwtPayload): Promise<{
        assessmentId: string;
    }>;
    getMyResult(): {
        message: string;
        result: any;
    };
    findOne(id: string, user: JwtPayload): Promise<import("./candidates.service").CandidateResponse>;
    update(id: string, updateCandidateDto: UpdateCandidateDto, user: JwtPayload): Promise<import("./candidates.service").CandidateResponse>;
    updateStatus(id: string, updateStatusDto: UpdateStatusDto, user: JwtPayload): Promise<import("./candidates.service").CandidateResponse>;
    remove(id: string): Promise<void>;
}
