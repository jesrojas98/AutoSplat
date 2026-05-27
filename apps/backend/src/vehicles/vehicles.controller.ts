import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { VehiclesService } from './vehicles.service'
import type { VehicleFilters } from './vehicles.service'
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RateLimit } from '../common/guards/rate-limit.guard'

@Controller('vehicles')
export class VehiclesController {
  constructor(private vehicles: VehiclesService) {}

  @Get()
  findAll(@Query() query: VehicleFilters) {
    return this.vehicles.findAll(query)
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: { id: string }) {
    return this.vehicles.findByUser(user.id)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehicles.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @RateLimit(10, 60_000) // 10 publicaciones por minuto por IP
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(user.id, dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: Partial<CreateVehicleDto> & { status?: string },
  ) {
    return this.vehicles.update(id, user.id, dto, user.role)
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  publish(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.vehicles.publish(id, user.id)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.vehicles.remove(id, user.id, user.role)
  }
}
