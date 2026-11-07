import {
  Controller, Post, Param, UseGuards, UseInterceptors,
  UploadedFile, UploadedFiles, BadRequestException, ParseUUIDPipe,
  NotFoundException, ForbiddenException,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { UploadService } from './upload.service'
import { SupabaseService } from '../supabase/supabase.service'
import { JobsService } from '../jobs/jobs.service'
import { ModalService } from '../modal/modal.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

const IMAGE_LIMITS = { fileSize: 10 * 1024 * 1024 } // 10 MB
const ALLOWED_TYPES = /^image\/(jpeg|jpg|png|webp)$/
// El frontend permite hasta 200 fotos libres + 21 ángulos guiados para el 3D
const MAX_RECONSTRUCTION_IMAGES = 250

interface AuthUser { id: string; role: string }

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private upload: UploadService,
    private supabase: SupabaseService,
    private jobs: JobsService,
    private modal: ModalService,
  ) {}

  @Post('vehicles/:vehicleId/images')
  @UseInterceptors(FilesInterceptor('images', 30, { limits: IMAGE_LIMITS }))
  async uploadVehicleImages(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    await this.assertCanManage(vehicleId, user)
    if (!files?.length) throw new BadRequestException('No se recibieron imágenes')

    files.forEach((f) => {
      if (!ALLOWED_TYPES.test(f.mimetype)) throw new BadRequestException(`Tipo no permitido: ${f.mimetype}`)
    })

    const uploaded = await this.upload.uploadMany(files, `vehicles/${vehicleId}`)

    const rows = uploaded.map((img, i) => ({
      vehicle_id: vehicleId,
      image_url: img.url,
      thumbnail_url: img.thumbnail_url,
      cloudinary_public_id: img.public_id,
      image_type: i === 0 ? 'thumbnail' : 'gallery',
      sort_order: i,
      width: img.width,
      height: img.height,
      file_size_kb: Math.round(img.bytes / 1024),
    }))

    const { data, error } = await this.supabase.admin
      .from('vehicle_images')
      .insert(rows)
      .select()

    if (error) throw new Error(error.message)
    return data
  }

  @Post('vehicles/:vehicleId/reconstruction')
  @UseInterceptors(FilesInterceptor('images', MAX_RECONSTRUCTION_IMAGES, { limits: IMAGE_LIMITS }))
  async uploadReconstructionImages(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    await this.assertCanManage(vehicleId, user)
    if (!files?.length) throw new BadRequestException('No se recibieron imágenes')

    files.forEach((f) => {
      if (!ALLOWED_TYPES.test(f.mimetype)) throw new BadRequestException(`Tipo no permitido: ${f.mimetype}`)
    })

    const uploaded = await this.upload.uploadMany(files, `vehicles/${vehicleId}/reconstruction`)

    const rows = uploaded.map((img, i) => ({
      vehicle_id: vehicleId,
      image_url: img.url,
      thumbnail_url: img.thumbnail_url,
      cloudinary_public_id: img.public_id,
      image_type: 'reconstruction',
      sort_order: i,
      width: img.width,
      height: img.height,
      file_size_kb: Math.round(img.bytes / 1024),
    }))

    const { data, error } = await this.supabase.admin
      .from('vehicle_images')
      .insert(rows)
      .select()

    if (error) throw new Error(error.message)

    // Auto-crear job de reconstrucción y disparar Modal
    const { job } = await this.jobs.create(vehicleId, files.length)
    await this.modal.triggerJob(job.id, vehicleId)

    return data
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', { limits: IMAGE_LIMITS }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió imagen')
    const result = await this.upload.uploadImage(file, 'avatars', { width: 200, height: 200 })
    return { url: result.url, public_id: result.public_id }
  }

  /** Solo el dueño del vehículo (o un admin) puede subirle fotos y disparar su procesamiento 3D. */
  private async assertCanManage(vehicleId: string, user: AuthUser) {
    const { data } = await this.supabase.admin
      .from('vehicles')
      .select('seller_id')
      .eq('id', vehicleId)
      .maybeSingle()
    if (!data) throw new NotFoundException('Vehículo no encontrado')
    if (user.role !== 'admin' && data.seller_id !== user.id) throw new ForbiddenException('No tienes permiso')
  }
}
