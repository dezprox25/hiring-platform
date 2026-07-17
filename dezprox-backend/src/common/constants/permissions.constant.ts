import { Role } from '../enums/role.enum';

export const ADMIN_ONLY = [Role.ADMIN];
export const ADMIN_HR = [Role.ADMIN, Role.HR];
export const ADMIN_MANAGER = [Role.ADMIN, Role.MANAGER];
export const ADMIN_HR_MANAGER = [Role.ADMIN, Role.HR, Role.MANAGER];
export const ALL_STAFF = [Role.ADMIN, Role.HR, Role.MANAGER];
export const ALL_ROLES = [Role.ADMIN, Role.HR, Role.MANAGER, Role.CANDIDATE];
