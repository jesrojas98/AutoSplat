import { Module } from '@nestjs/common'
import { UploadService } from './upload.service'
import { UploadController } from './upload.controller'
import { JobsModule } from '../jobs/jobs.module'
import { ModalModule } from '../modal/modal.module'

@Module({
  imports: [JobsModule, ModalModule],
  providers: [UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
