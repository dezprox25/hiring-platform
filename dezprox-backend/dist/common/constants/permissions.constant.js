"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_ROLES = exports.ALL_STAFF = exports.ADMIN_HR_MANAGER = exports.ADMIN_MANAGER = exports.ADMIN_HR = exports.ADMIN_ONLY = void 0;
const role_enum_1 = require("../enums/role.enum");
exports.ADMIN_ONLY = [role_enum_1.Role.ADMIN];
exports.ADMIN_HR = [role_enum_1.Role.ADMIN, role_enum_1.Role.HR];
exports.ADMIN_MANAGER = [role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER];
exports.ADMIN_HR_MANAGER = [role_enum_1.Role.ADMIN, role_enum_1.Role.HR, role_enum_1.Role.MANAGER];
exports.ALL_STAFF = [role_enum_1.Role.ADMIN, role_enum_1.Role.HR, role_enum_1.Role.MANAGER];
exports.ALL_ROLES = [role_enum_1.Role.ADMIN, role_enum_1.Role.HR, role_enum_1.Role.MANAGER, role_enum_1.Role.CANDIDATE];
//# sourceMappingURL=permissions.constant.js.map