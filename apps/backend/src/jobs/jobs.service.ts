import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class JobsService {
  constructor(private supabase: SupabaseService) {}

  async create(vehicleId: string, inputImagesCount: number) {
    // Crear entrada en vehicle_3d_models
    const { data: model, error: modelError } = await this.supabase.admin
      .from('vehicle_3d_models')
      .insert({ vehicle_id: vehicleId, status: 'pending', input_images_count: inputImagesCount })
      .select()
      .single()
    if (modelError) throw new Error(modelError.message)

    // Crear el job de procesamiento
    const { data: job, error: jobError } = await this.supabase.admin
      .from('processing_jobs')
      .insert({
        vehicle_id: vehicleId,
        model_id: model.id,
        status: 'pending',
        current_step: 'validating_images',
        progress: 0,
      })
      .select()
      .single()
    if (jobError) throw new Error(jobError.message)

    // Marcar el vehículo como que tendrá modelo 3D
    await this.supabase.admin
      .from('vehicles')
      .update({ has_3d_model: true })
      .eq('id', vehicleId)

    return { job, model }
  }

  async getByVehicle(vehicleId: string) {
    const { data, error } = await this.supabase.admin
      .from('processing_jobs')
      .select(`
        id, status, progress, current_step, error_message, created_at, started_at, finished_at,
        vehicle_3d_models(id, status, model_url, preview_image_url, num_gaussians, processing_time_seconds)
      `)
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error) return null
    return data
  }

  async getById(jobId: string) {
    const { data, error } = await this.supabase.admin
      .from('processing_jobs')
      .select(`
        id, status, progress, current_step, error_message, created_at, started_at, finished_at,
        vehicle_3d_models(id, status, model_url, preview_image_url)
      `)
      .eq('id', jobId)
      .single()
    if (error || !data) throw new NotFoundException('Job no encontrado')
    return data
  }

  // Llamado por el worker Python para actualizar progreso
  async updateProgress(jobId: string, dto: {
    status?: string
    progress?: number
    current_step?: string
    error_message?: string
    worker_id?: string
  }) {
    const updates: any = { ...dto }
    if (dto.status === 'processing' && !updates.started_at) updates.started_at = new Date().toISOString()
    if (dto.status === 'completed' || dto.status === 'failed') updates.finished_at = new Date().toISOString()

    const { data, error } = await this.supabase.admin
      .from('processing_jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  async completeWithModel(jobId: string, modelData: {
    model_url: string
    preview_image_url?: string
    num_gaussians?: number
    processing_time_seconds?: number
  }) {
    const job = await this.getById(jobId)

    await this.supabase.admin
      .from('vehicle_3d_models')
      .update({
        status: 'completed',
        ...modelData,
        completed_at: new Date().toISOString(),
      })
      .eq('id', (job as any).vehicle_3d_models?.id)

    return this.updateProgress(jobId, { status: 'completed', progress: 100, current_step: 'completed' })
  }
}
