import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common'
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

  // Worker Python llama esto para actualizar progreso
  @Patch(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() body: { status?: string; progress?: number; current_step?: string; error_message?: string; worker_id?: string },
  ) {
    return this.jobs.updateProgress(id, body)
  }

  // Worker Python llama esto cuando termina exitosamente
  @Patch(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() body: { model_url: string; preview_image_url?: string; num_gaussians?: number; processing_time_seconds?: number },
  ) {
    return this.jobs.completeWithModel(id, body)
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
