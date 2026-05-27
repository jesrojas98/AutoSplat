import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ModalService {
  private readonly logger = new Logger(ModalService.name)
  private readonly webhookUrl: string | undefined

  constructor(private config: ConfigService) {
    this.webhookUrl = this.config.get<string>('MODAL_WEBHOOK_URL')
  }

  get isConfigured(): boolean {
    return !!this.webhookUrl
  }

  async triggerJob(jobId: string, vehicleId: string): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn('MODAL_WEBHOOK_URL no configurado — job creado pero no disparado. El worker local lo tomará por polling.')
      return
    }

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, vehicle_id: vehicleId }),
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) {
        const text = await res.text()
        this.logger.error('Modal webhook respondió %d: %s', res.status, text)
      } else {
        this.logger.log('Job %s enviado a Modal correctamente', jobId)
      }
    } catch (err) {
      // No bloquear al usuario si Modal falla — el job ya está en DB
      this.logger.error('Error llamando Modal webhook: %s', (err as Error).message)
    }
  }
}
