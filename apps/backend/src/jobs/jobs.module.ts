import { Module } from '@nestjs/common'
import { JobsService } from './jobs.service'
import { JobsController } from './jobs.controller'
import { JobsMaintenanceService } from './jobs-maintenance.service'
import { ModalModule } from '../modal/modal.module'

@Module({
  imports: [ModalModule],
  providers: [JobsService, JobsMaintenanceService],
  controllers: [JobsController],
  exports: [JobsService],
})
export class JobsModule {}
