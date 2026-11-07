import { Controller, Get, Patch, Delete, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AdminService } from './admin.service'
import { UpdateRoleDto } from './dto/update-role.dto'

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
    @CurrentUser() actor: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateRoleDto,
  ) {
    return this.admin.updateRole(actor.id, id, body.role)
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() actor: { id: string }, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteUser(actor.id, id)
  }
}
