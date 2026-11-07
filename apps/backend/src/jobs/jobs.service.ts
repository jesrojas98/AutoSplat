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

  /**
   * Marca un job (y su modelo) como fallido y quita el 3D del vehículo, para que la ficha
   * no quede en "procesando" para siempre. Devuelve false si el job ya había terminado.
   */
  async markFailed(job: { id: string; vehicle_id: string; model_id: string | null }, message: string) {
    const now = new Date().toISOString()
    const { data, error } = await this.supabase.admin
      .from('processing_jobs')
      .update({ status: 'failed', current_step: 'failed', error_message: message.slice(0, 1000), finished_at: now })
      .eq('id', job.id)
      .in('status', ['pending', 'processing'])
      .select('id')
    if (error) throw new Error(error.message)
    if (!data?.length) return false

    if (job.model_id) {
      await this.supabase.admin
        .from('vehicle_3d_models')
        .update({ status: 'failed', error_message: message.slice(0, 1000) })
        .eq('id', job.model_id)
    }
    await this.supabase.admin.from('vehicles').update({ has_3d_model: false }).eq('id', job.vehicle_id)
    return true
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
}
