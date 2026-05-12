import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common'
import { FavoritesService } from './favorites.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favorites: FavoritesService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.favorites.findByUser(user.id)
  }

  @Post(':vehicleId/toggle')
  toggle(@CurrentUser() user: { id: string }, @Param('vehicleId') vehicleId: string) {
    return this.favorites.toggle(user.id, vehicleId)
  }

  @Get(':vehicleId/saved')
  isSaved(@CurrentUser() user: { id: string }, @Param('vehicleId') vehicleId: string) {
    return this.favorites.isSaved(user.id, vehicleId)
  }
}
