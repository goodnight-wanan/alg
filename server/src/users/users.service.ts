import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { publicUserSelect } from './user.types.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findForAuthentication(account: string) {
    const normalizedAccount = account.trim().toLowerCase();

    return this.prisma.user.findFirst({
      where: {
        OR: [
          { usernameNormalized: normalizedAccount },
          { email: normalizedAccount },
        ],
      },
    });
  }

  findPublicById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
      select: publicUserSelect,
    });
  }

  markLoggedIn(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
