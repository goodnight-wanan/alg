import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AdminUsersService } from './admin-users.service.js';
import {
  AdminUserQueryDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/admin-users.dto.js';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  listUsers(@Query() query: AdminUserQueryDto) {
    return this.adminUsersService.listUsers(query);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminUsersService.updateStatus(id, dto, request.user.id);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminUsersService.updateRole(id, dto, request.user.id);
  }

  @Delete(':id')
  deleteUser(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminUsersService.deleteUser(id, request.user.id);
  }
}
