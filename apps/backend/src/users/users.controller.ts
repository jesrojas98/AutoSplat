import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: { id: string }) {
    return this.users.findById(user.id)
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: { id: string },
    @Body() body: { name?: string; phone?: string; avatar_url?: string },
  ) {
    return this.users.updateProfile(user.id, body)
  }
}
