import {
  Controller, Post, Param, UseGuards, UseInterceptors,
  UploadedFile, UploadedFiles, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { UploadService } from './upload.service'
import { SupabaseService } from '../supabase/supabase.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

const IMAGE_LIMITS = { fileSize: 10 * 1024 * 1024 } // 10 MB
const ALLOWED_TYPES = /^image\/(jpeg|jpg|png|webp)$/

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private upload: UploadService,
    private supabase: SupabaseService,
  ) {}

  @Post('vehicles/:vehicleId/images')
  @UseInterceptors(FilesInterceptor('images', 30, { limits: IMAGE_LIMITS }))
  async uploadVehicleImages(
    @Param('vehicleId') vehicleId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
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
  @UseInterceptors(FilesInterceptor('images', 50, { limits: IMAGE_LIMITS }))
  async uploadReconstructionImages(
    @Param('vehicleId') vehicleId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('No se recibieron imágenes')

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
    return data
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', { limits: IMAGE_LIMITS }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió imagen')
    const result = await this.upload.uploadImage(file, 'avatars', { width: 200, height: 200 })
    return { url: result.url, public_id: result.public_id }
  }
}
