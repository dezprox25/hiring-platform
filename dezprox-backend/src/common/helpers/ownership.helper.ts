import { ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/role.enum';

/**
 * Asserts that the requesting user owns the resource or has a bypass role.
 * Use this in service methods to ensure candidates can only access their own data,
 * while allowing staff (Admin, HR, Manager) to access all records.
 * 
 * @param requestingUserId The ID of the user making the request (from JWT sub)
 * @param resourceOwnerId The ID of the user who owns the resource
 * @param userRole The role of the requesting user
 * @param bypassRoles Roles that are allowed to skip the ownership check
 * @throws ForbiddenException if ownership is not established
 */
export function assertOwnership(
  requestingUserId: string,
  resourceOwnerId: string,
  userRole: Role,
  bypassRoles: Role[] = [Role.ADMIN, Role.HR, Role.MANAGER],
): void {
  if (bypassRoles.includes(userRole)) {
    return;
  }

  if (requestingUserId !== resourceOwnerId) {
    throw new ForbiddenException('Access denied');
  }
}
