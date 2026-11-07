import { Module } from '@nestjs/common'
import { VehiclesService } from './vehicles.service'
import { VehiclesController } from './vehicles.controller'
import { UploadModule } from '../upload/upload.module'

@Module({
  imports: [UploadModule],
  providers: [VehiclesService],
  controllers: [VehiclesController],
  exports: [VehiclesService],
})
export class VehiclesModule {}
