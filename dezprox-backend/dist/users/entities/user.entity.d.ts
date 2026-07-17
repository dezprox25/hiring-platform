import { Role } from '../../common/enums/role.enum';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Feedback } from '../../reports/entities/feedback.entity';
export declare class User {
    id: string;
    email: string;
    password_hash: string;
    role: Role;
    is_active: boolean;
    refresh_token_hash: string;
    created_at: Date;
    updated_at: Date;
    candidate: Candidate;
    feedbacks: Feedback[];
}
