import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { JobsService } from '../jobs/jobs.service'
import { SupabaseService } from '../supabase/supabase.service'

function buildChain(result: { data?: any; error?: any } = {}) {
  const r = { data: null, error: null, ...result }
  const chain: any = {}
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit']) {
    chain[m] = jest.fn().mockReturnValue(chain)
  }
  chain.single = jest.fn().mockResolvedValue(r)
  chain.then = (res: any, rej: any) => Promise.resolve(r).then(res, rej)
  return chain
}

const mockJob = {
  id: 'job-1',
  vehicle_id: 'v1',
  model_id: 'model-1',
  status: 'pending',
  current_step: 'validating_images',
  progress: 0,
  error_message: null,
  created_at: '2024-01-01T00:00:00Z',
  started_at: null,
  finished_at: null,
  vehicle_3d_models: { id: 'model-1', status: 'pending', model_url: null, preview_image_url: null },
}

describe('JobsService', () => {
  let service: JobsService
  let supabase: { admin: { from: jest.Mock } }

  beforeEach(async () => {
    supabase = { admin: { from: jest.fn() } }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile()

    service = module.get(JobsService)
  })

  // ── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('crea model y job y retorna ambos', async () => {
      supabase.admin.from
        .mockReturnValueOnce(buildChain({ data: { id: 'model-1', vehicle_id: 'v1', status: 'pending' } }))  // vehicle_3d_models insert
        .mockReturnValueOnce(buildChain({ data: mockJob }))  // processing_jobs insert
        .mockReturnValueOnce(buildChain({ data: null }))      // vehicles update

      const result = await service.create('v1', 10)

      expect(result).toHaveProperty('job')
      expect(result).toHaveProperty('model')
    })

    it('crea el modelo con status pending', async () => {
      const modelChain = buildChain({ data: { id: 'model-1' } })
      supabase.admin.from
        .mockReturnValueOnce(modelChain)
        .mockReturnValueOnce(buildChain({ data: mockJob }))
        .mockReturnValueOnce(buildChain({ data: null }))

      await service.create('v1', 10)

      expect(modelChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ vehicle_id: 'v1', status: 'pending', input_images_count: 10 }),
      )
    })

    it('crea el job con current_step validating_images', async () => {
      const jobChain = buildChain({ data: mockJob })
      supabase.admin.from
        .mockReturnValueOnce(buildChain({ data: { id: 'model-1' } }))
        .mockReturnValueOnce(jobChain)
        .mockReturnValueOnce(buildChain({ data: null }))

      await service.create('v1', 10)

      expect(jobChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ current_step: 'validating_images', progress: 0 }),
      )
    })

    it('actualiza has_3d_model en el vehículo', async () => {
      const vehicleChain = buildChain({ data: null })
      supabase.admin.from
        .mockReturnValueOnce(buildChain({ data: { id: 'model-1' } }))
        .mockReturnValueOnce(buildChain({ data: mockJob }))
        .mockReturnValueOnce(vehicleChain)

      await service.create('v1', 10)

      expect(vehicleChain.update).toHaveBeenCalledWith({ has_3d_model: true })
    })

    it('lanza error si falla la creación del modelo', async () => {
      supabase.admin.from.mockReturnValue(
        buildChain({ data: null, error: { message: 'model insert failed' } }),
      )

      await expect(service.create('v1', 10)).rejects.toThrow('model insert failed')
    })
  })

  // ── getByVehicle ──────────────────────────────────────────────────────────

  describe('getByVehicle()', () => {
    it('retorna el job más reciente del vehículo', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: mockJob }))

      const result = await service.getByVehicle('v1')

      expect(result).toMatchObject({ id: 'job-1' })
    })

    it('retorna null si no existe job para el vehículo', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'not found' } }))

      const result = await service.getByVehicle('v-sin-job')

      expect(result).toBeNull()
    })
  })

  // ── getById ───────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('retorna el job cuando existe', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: mockJob }))

      const result = await service.getById('job-1')

      expect(result).toMatchObject({ id: 'job-1' })
    })

    it('lanza NotFoundException cuando el job no existe', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'not found' } }))

      await expect(service.getById('unknown-job')).rejects.toThrow(NotFoundException)
    })

    it('lanza NotFoundException con mensaje correcto', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'not found' } }))

      await expect(service.getById('unknown-job')).rejects.toThrow('Job no encontrado')
    })
  })

  // ── updateProgress ────────────────────────────────────────────────────────

  describe('updateProgress()', () => {
    it('actualiza el progreso y lo retorna', async () => {
      const updated = { ...mockJob, status: 'processing', progress: 50 }
      supabase.admin.from.mockReturnValue(buildChain({ data: updated }))

      const result = await service.updateProgress('job-1', { status: 'processing', progress: 50 })

      expect(result).toMatchObject({ progress: 50 })
    })

    it('agrega started_at cuando status cambia a processing', async () => {
      const chain = buildChain({ data: { ...mockJob, status: 'processing' } })
      supabase.admin.from.mockReturnValue(chain)

      await service.updateProgress('job-1', { status: 'processing' })

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ started_at: expect.any(String) }),
      )
    })

    it('no sobreescribe started_at si ya viene en el dto', async () => {
      const chain = buildChain({ data: { ...mockJob, status: 'processing' } })
      supabase.admin.from.mockReturnValue(chain)
      const existingDate = '2024-01-01T09:00:00Z'

      await service.updateProgress('job-1', { status: 'processing', started_at: existingDate } as any)

      // Cuando started_at ya viene en dto, no se sobreescribe (el campo ya existe en updates)
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ started_at: existingDate }),
      )
    })

    it('agrega finished_at cuando status es completed', async () => {
      const chain = buildChain({ data: { ...mockJob, status: 'completed' } })
      supabase.admin.from.mockReturnValue(chain)

      await service.updateProgress('job-1', { status: 'completed', progress: 100 })

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ finished_at: expect.any(String) }),
      )
    })

    it('agrega finished_at cuando status es failed', async () => {
      const chain = buildChain({ data: { ...mockJob, status: 'failed' } })
      supabase.admin.from.mockReturnValue(chain)

      await service.updateProgress('job-1', { status: 'failed', error_message: 'Error en procesamiento' })

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ finished_at: expect.any(String) }),
      )
    })

    it('lanza error si Supabase devuelve error', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'update failed' } }))

      await expect(service.updateProgress('job-1', {})).rejects.toThrow('update failed')
    })
  })

  // ── completeWithModel ─────────────────────────────────────────────────────

  describe('completeWithModel()', () => {
    it('actualiza el modelo y marca el job como completado', async () => {
      const completedJob = { ...mockJob, status: 'completed', progress: 100 }

      supabase.admin.from
        .mockReturnValueOnce(buildChain({ data: mockJob }))           // getById
        .mockReturnValueOnce(buildChain({ data: null }))               // model update
        .mockReturnValueOnce(buildChain({ data: completedJob }))       // job update

      const result = await service.completeWithModel('job-1', {
        model_url: 'https://cdn.example.com/model.splat',
        preview_image_url: 'https://cdn.example.com/preview.jpg',
        num_gaussians: 50000,
        processing_time_seconds: 120,
      })

      expect(result).toMatchObject({ status: 'completed', progress: 100 })
    })
  })
})
