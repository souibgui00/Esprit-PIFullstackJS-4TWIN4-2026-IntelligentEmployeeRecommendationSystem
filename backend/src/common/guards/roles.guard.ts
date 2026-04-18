import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      console.error('[RolesGuard] User not found or role not defined', { user });
      throw new ForbiddenException('User not found or role not defined');
    }

    const userRole = user.role.toUpperCase() as Role;

    // ADMIN has access to everything (role hierarchy)
    if (userRole === Role.ADMIN) {
      return true;
    }

    if (!requiredRoles.includes(userRole)) {
      console.error(`[RolesGuard] Access denied - User role ${userRole} not in required roles`, { userRole, requiredRoles });
      throw new ForbiddenException(
        `Access denied. User role: ${userRole}. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
