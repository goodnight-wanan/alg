import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { publicUserSelect } from '../users/user.types.js';
import {
  AdminUserQueryDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/admin-users.dto.js';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: AdminUserQueryDto) {
    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { username: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { nickname: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: publicUserSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    currentUserId: string,
  ) {
    await this.assertTarget(id, currentUserId);
    return this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: publicUserSelect,
    });
  }

  async updateRole(id: string, dto: UpdateUserRoleDto, currentUserId: string) {
    await this.assertTarget(id, currentUserId);
    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: publicUserSelect,
    });
  }

  async deleteUser(id: string, currentUserId: string) {
    await this.assertTarget(id, currentUserId);
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertTarget(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException({
        code: 'SELF_OPERATION_FORBIDDEN',
        message: '不能对当前登录的管理员账号执行此操作',
      });
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }
  }
}
