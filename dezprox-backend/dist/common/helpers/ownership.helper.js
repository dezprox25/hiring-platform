"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertOwnership = assertOwnership;
const common_1 = require("@nestjs/common");
const role_enum_1 = require("../enums/role.enum");
function assertOwnership(requestingUserId, resourceOwnerId, userRole, bypassRoles = [role_enum_1.Role.ADMIN, role_enum_1.Role.HR, role_enum_1.Role.MANAGER]) {
    if (bypassRoles.includes(userRole)) {
        return;
    }
    if (requestingUserId !== resourceOwnerId) {
        throw new common_1.ForbiddenException('Access denied');
    }
}
//# sourceMappingURL=ownership.helper.js.map