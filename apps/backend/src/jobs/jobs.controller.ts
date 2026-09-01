import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common'
import { JobsService } from './jobs.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

@Controller('jobs')
export class JobsController {
  constructor(private jobs: JobsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: { vehicleId: string; inputImagesCount: number }) {
    return this.jobs.create(body.vehicleId, body.inputImagesCount)
  }

  // Frontend consulta estado del job de un vehículo
  @Get('vehicle/:vehicleId')
  @UseGuards(JwtAuthGuard)
  getByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.jobs.getByVehicle(vehicleId)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Param('id') id: string) {
    return this.jobs.getById(id)
  }
}
