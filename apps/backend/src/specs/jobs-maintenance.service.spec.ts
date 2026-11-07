import { JobsMaintenanceService } from '../jobs/jobs-maintenance.service'
import { JobsService } from '../jobs/jobs.service'

const NOW = new Date('2026-11-07T12:00:00Z').getTime()
const ago = (ms: number) => new Date(NOW - ms).toISOString()
const MIN = 60_000
const HOUR = 60 * MIN

/** Devuelve las filas según el .eq('status', …) de la consulta, como lo haría Supabase. */
function supabaseWith(rows: { processing?: any[]; pending?: any[] }) {
  return {
    admin: {
      from: jest.fn(() => {
        let status = ''
        const chain: any = {}
        chain.select = () => chain
        chain.eq = (_col: string, value: string) => { status = value; return chain }
        chain.lt = () => chain
        chain.order = () => chain
        chain.limit = () => Promise.resolve({ data: (rows as any)[status] ?? [] })
        return chain
      }),
    },
  }
}

describe('JobsMaintenanceService.recover()', () => {
  let jobs: { markFailed: jest.Mock }
  let modal: { isConfigured: boolean; triggerJob: jest.Mock }

  const build = (rows: Parameters<typeof supabaseWith>[0]) =>
    new JobsMaintenanceService(supabaseWith(rows) as any, modal as any, jobs as unknown as JobsService)

  beforeEach(() => {
    jobs = { markFailed: jest.fn().mockResolvedValue(true) }
    modal = { isConfigured: true, triggerJob: jest.fn().mockResolvedValue(undefined) }
  })

  it('marca como fallido un job que lleva "processing" más de lo que Modal permite', async () => {
    const job = { id: 'j1', vehicle_id: 'v1', model_id: 'm1' }
    const res = await build({ processing: [job] }).recover(NOW)
    expect(jobs.markFailed).toHaveBeenCalledWith(job, expect.stringContaining('tiempo máximo'))
    expect(res).toEqual({ failed: 1, retriggered: 0 })
  })

  it('reenvía a Modal un job pendiente de hace más de 5 minutos', async () => {
    const job = { id: 'j2', vehicle_id: 'v2', model_id: 'm2', created_at: ago(30 * MIN) }
    const res = await build({ pending: [job] }).recover(NOW)
    expect(modal.triggerJob).toHaveBeenCalledWith('j2', 'v2')
    expect(jobs.markFailed).not.toHaveBeenCalled()
    expect(res).toEqual({ failed: 0, retriggered: 1 })
  })

  it('se rinde con un job pendiente de más de 24 horas', async () => {
    const job = { id: 'j3', vehicle_id: 'v3', model_id: 'm3', created_at: ago(25 * HOUR) }
    const res = await build({ pending: [job] }).recover(NOW)
    expect(jobs.markFailed).toHaveBeenCalledWith(job, expect.stringContaining('No se pudo iniciar'))
    expect(modal.triggerJob).not.toHaveBeenCalled()
    expect(res.failed).toBe(1)
  })

  it('no reenvía nada si Modal no está configurado (worker local por polling)', async () => {
    modal.isConfigured = false
    const job = { id: 'j4', vehicle_id: 'v4', model_id: null, created_at: ago(30 * MIN) }
    const res = await build({ pending: [job] }).recover(NOW)
    expect(modal.triggerJob).not.toHaveBeenCalled()
    expect(res).toEqual({ failed: 0, retriggered: 0 })
  })

  it('no cuenta como fallido un job que terminó mientras tanto', async () => {
    jobs.markFailed.mockResolvedValue(false)
    const res = await build({ processing: [{ id: 'j5', vehicle_id: 'v5', model_id: null }] }).recover(NOW)
    expect(res.failed).toBe(0)
  })

  it('no hace nada si no hay jobs atascados', async () => {
    const res = await build({}).recover(NOW)
    expect(res).toEqual({ failed: 0, retriggered: 0 })
    expect(jobs.markFailed).not.toHaveBeenCalled()
  })

  it('un error de base de datos no tumba el proceso', async () => {
    jobs.markFailed.mockRejectedValue(new Error('db caída'))
    await expect(
      build({ processing: [{ id: 'j6', vehicle_id: 'v6', model_id: null }] }).recover(NOW),
    ).resolves.toEqual({ failed: 0, retriggered: 0 })
  })
})

describe('JobsService.markFailed()', () => {
  function build(updatedJobRows: any[], completedModels = 0) {
    const calls: { table: string; payload: any }[] = []
    const supabase = {
      admin: {
        from: jest.fn((table: string) => ({
          update: (payload: any) => {
            calls.push({ table, payload })
            const chain: any = {}
            chain.eq = () => chain
            chain.in = () => chain
            chain.select = () => Promise.resolve({ data: updatedJobRows, error: null })
            chain.then = (res: any, rej: any) => Promise.resolve({ error: null }).then(res, rej)
            return chain
          },
          // conteo de modelos ya completados del vehículo
          select: () => ({ eq: () => ({ eq: () => Promise.resolve({ count: completedModels }) }) }),
        })),
      },
    }
    return { service: new JobsService(supabase as any), calls }
  }

  it('marca job y modelo como fallidos y quita el 3D del vehículo', async () => {
    const { service, calls } = build([{ id: 'j1' }])
    const ok = await service.markFailed({ id: 'j1', vehicle_id: 'v1', model_id: 'm1' }, 'falló')
    expect(ok).toBe(true)
    expect(calls).toEqual([
      { table: 'processing_jobs', payload: expect.objectContaining({ status: 'failed', error_message: 'falló' }) },
      { table: 'vehicle_3d_models', payload: expect.objectContaining({ status: 'failed' }) },
      { table: 'vehicles', payload: { has_3d_model: false } },
    ])
  })

  it('conserva el 3D del vehículo si ya tiene otro modelo completado', async () => {
    const { service, calls } = build([{ id: 'j1' }], 1)
    await service.markFailed({ id: 'j1', vehicle_id: 'v1', model_id: 'm1' }, 'falló')
    expect(calls.map((c) => c.table)).toEqual(['processing_jobs', 'vehicle_3d_models'])
  })

  it('no toca modelo ni vehículo si el job ya había terminado', async () => {
    const { service, calls } = build([])
    const ok = await service.markFailed({ id: 'j1', vehicle_id: 'v1', model_id: 'm1' }, 'falló')
    expect(ok).toBe(false)
    expect(calls).toHaveLength(1)
  })
})
