import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { ModalService } from '../modal/modal.service'
import { JobsService } from './jobs.service'

// Modal corta cada job a las 2 h (timeout=7200 en worker/modal_app.py); se deja margen
const STALE_PROCESSING_MS = 2 * 60 * 60_000 + 10 * 60_000
// Un job que sigue pendiente después de esto no llegó a Modal: se reintenta el webhook
const PENDING_RETRY_AFTER_MS = 5 * 60_000
const PENDING_GIVE_UP_AFTER_MS = 24 * 60 * 60_000
const FIRST_RUN_DELAY_MS = 60_000
const INTERVAL_MS = 10 * 60_000
const BATCH = 20

type JobRow = { id: string; vehicle_id: string; model_id: string | null; created_at?: string }

/**
 * Recupera jobs 3D que quedaron en el limbo: webhook de Modal caído, contenedor cortado
 * por timeout o worker muerto. Sin esto el modelo se queda "procesando" para siempre.
 */
@Injectable()
export class JobsMaintenanceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsMaintenanceService.name)
  private timers: NodeJS.Timeout[] = []
  private running = false

  constructor(
    private supabase: SupabaseService,
    private modal: ModalService,
    private jobs: JobsService,
  ) {}

  onModuleInit() {
    const first = setTimeout(() => void this.recover(), FIRST_RUN_DELAY_MS)
    const loop = setInterval(() => void this.recover(), INTERVAL_MS)
    first.unref()
    loop.unref()
    this.timers = [first, loop]
  }

  onModuleDestroy() {
    this.timers.forEach((t) => { clearTimeout(t); clearInterval(t) })
  }

  async recover(now = Date.now()): Promise<{ failed: number; retriggered: number }> {
    const result = { failed: 0, retriggered: 0 }
    if (this.running) return result
    this.running = true
    try {
      // 1. Procesando por más tiempo del que Modal permite → el contenedor murió
      const { data: stuck } = await this.supabase.admin
        .from('processing_jobs')
        .select('id, vehicle_id, model_id')
        .eq('status', 'processing')
        .lt('started_at', new Date(now - STALE_PROCESSING_MS).toISOString())
        .limit(BATCH)
      for (const job of (stuck ?? []) as JobRow[]) {
        if (await this.jobs.markFailed(job, 'El procesamiento 3D superó el tiempo máximo y se canceló')) result.failed++
      }

      // 2. Pendientes que nadie tomó: reintentar el webhook, o rendirse si pasó demasiado
      const { data: pending } = await this.supabase.admin
        .from('processing_jobs')
        .select('id, vehicle_id, model_id, created_at')
        .eq('status', 'pending')
        .lt('created_at', new Date(now - PENDING_RETRY_AFTER_MS).toISOString())
        .order('created_at', { ascending: true })
        .limit(BATCH)
      for (const job of (pending ?? []) as JobRow[]) {
        const age = now - new Date(job.created_at ?? now).getTime()
        if (age > PENDING_GIVE_UP_AFTER_MS) {
          if (await this.jobs.markFailed(job, 'No se pudo iniciar el procesamiento 3D')) result.failed++
        } else if (this.modal.isConfigured) {
          await this.modal.triggerJob(job.id, job.vehicle_id)
          result.retriggered++
        }
      }

      if (result.failed || result.retriggered) {
        this.logger.log(`Jobs recuperados: ${result.failed} fallidos, ${result.retriggered} reenviados a Modal`)
      }
    } catch (err) {
      this.logger.error('Error recuperando jobs 3D: %s', (err as Error).message)
    } finally {
      this.running = false
    }
    return result
  }
}
