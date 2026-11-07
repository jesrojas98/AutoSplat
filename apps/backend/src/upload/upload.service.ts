import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { Readable } from 'stream'

const UPLOAD_CONCURRENCY = 8

@Injectable()
export class UploadService implements OnModuleInit {
  constructor(private config: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.config.getOrThrow('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.getOrThrow('CLOUDINARY_API_KEY'),
      api_secret: this.config.getOrThrow('CLOUDINARY_API_SECRET'),
    })
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
    options: { width?: number; height?: number } = {},
  ): Promise<{ url: string; thumbnail_url: string; public_id: string; width: number; height: number; bytes: number }> {
    const result = await this.streamUpload(file.buffer, {
      folder: `autosplat/${folder}`,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    })

    const thumbnail_url = cloudinary.url(result.public_id, {
      width: 400,
      height: 300,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    })

    return {
      url: result.secure_url,
      thumbnail_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    }
  }

  async uploadMany(files: Express.Multer.File[], folder: string) {
    // Por tandas: con 100+ fotos, subirlas todas a la vez satura Cloudinary y la memoria
    const results: Awaited<ReturnType<UploadService['uploadImage']>>[] = []
    for (let i = 0; i < files.length; i += UPLOAD_CONCURRENCY) {
      const batch = files.slice(i, i + UPLOAD_CONCURRENCY)
      results.push(...(await Promise.all(batch.map((f) => this.uploadImage(f, folder)))))
    }
    return results
  }

  async deleteImage(publicId: string) {
    return cloudinary.uploader.destroy(publicId)
  }

  private streamUpload(buffer: Buffer, options: object): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) return reject(error)
        resolve(result)
      })
      Readable.from(buffer).pipe(stream)
    })
  }
}
