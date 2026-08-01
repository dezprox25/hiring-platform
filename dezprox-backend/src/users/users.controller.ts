import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Post()
  async create(@Body() body: { email: string; role: Role; password?: string; is_active?: boolean }) {
    try {
      if (!body.email || !body.role) {
        throw new BadRequestException('Email and role are required');
      }
      return await this.usersService.createUser(body);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      throw new BadRequestException(msg);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { role?: Role; is_active?: boolean; password?: string }) {
    try {
      return await this.usersService.updateUser(id, body);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      throw new NotFoundException(msg);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.removeUser(id);
    return { success: true, message: 'User deleted successfully' };
  }
}
