import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { AdminService } from './admin.service'

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('users')
  listUsers() {
    return this.admin.listUsers()
  }

  @Get('vehicles')
  listVehicles() {
    return this.admin.listVehicles()
  }

  @Patch('users/:id/role')
  updateRole(
    @Param('id') id: string,
    @Body('role') role: 'buyer' | 'seller' | 'admin',
  ) {
    return this.admin.updateRole(id, role)
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id)
  }
}
