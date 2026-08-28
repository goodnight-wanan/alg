import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserStatus } from '@prisma/client';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  function createContext(role: UserRole) {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'user-id',
            username: 'tester',
            email: 'tester@example.com',
            role,
            status: UserStatus.ACTIVE,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows users with a required role', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.ADMIN]),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(createContext(UserRole.ADMIN))).toBe(true);
  });

  it('rejects users without a required role', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.ADMIN]),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(() => guard.canActivate(createContext(UserRole.USER))).toThrow(
      ForbiddenException,
    );
  });
});
