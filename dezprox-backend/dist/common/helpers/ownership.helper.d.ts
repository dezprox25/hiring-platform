import { Role } from '../enums/role.enum';
export declare function assertOwnership(requestingUserId: string, resourceOwnerId: string, userRole: Role, bypassRoles?: Role[]): void;
