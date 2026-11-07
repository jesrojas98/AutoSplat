import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { UploadController } from '../upload/upload.controller'

function file(mimetype = 'image/jpeg') {
  return { mimetype, buffer: Buffer.from('x') } as Express.Multer.File
}

describe('UploadController — permisos sobre el vehículo', () => {
  let controller: UploadController
  let upload: { uploadMany: jest.Mock }
  let jobs: { create: jest.Mock }
  let modal: { triggerJob: jest.Mock }
  let vehicleRow: { seller_id: string } | null

  const VEHICLE_ID = '11111111-1111-4111-8111-111111111111'

  beforeEach(() => {
    vehicleRow = { seller_id: 'owner' }
    upload = { uploadMany: jest.fn().mockResolvedValue([]) }
    jobs = { create: jest.fn().mockResolvedValue({ job: { id: 'job-1' } }) }
    modal = { triggerJob: jest.fn() }

    const insertChain = { select: jest.fn().mockResolvedValue({ data: [], error: null }) }
    const supabase = {
      admin: {
        from: jest.fn((table: string) =>
          table === 'vehicles'
            ? { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: vehicleRow }) }) }) }
            : { insert: () => insertChain },
        ),
      },
    }

    controller = new UploadController(upload as any, supabase as any, jobs as any, modal as any)
  })

  it('rechaza con 403 a un usuario que no es dueño (galería)', async () => {
    await expect(
      controller.uploadVehicleImages(VEHICLE_ID, { id: 'intruso', role: 'seller' }, [file()]),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(upload.uploadMany).not.toHaveBeenCalled()
  })

  it('rechaza con 403 a un no dueño y no dispara el job 3D', async () => {
    await expect(
      controller.uploadReconstructionImages(VEHICLE_ID, { id: 'intruso', role: 'buyer' }, [file()]),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(jobs.create).not.toHaveBeenCalled()
    expect(modal.triggerJob).not.toHaveBeenCalled()
  })

  it('responde 404 si el vehículo no existe', async () => {
    vehicleRow = null
    await expect(
      controller.uploadReconstructionImages(VEHICLE_ID, { id: 'owner', role: 'seller' }, [file()]),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('permite al dueño subir fotos de reconstrucción y dispara el job', async () => {
    await controller.uploadReconstructionImages(VEHICLE_ID, { id: 'owner', role: 'seller' }, [file()])
    expect(upload.uploadMany).toHaveBeenCalled()
    expect(jobs.create).toHaveBeenCalledWith(VEHICLE_ID, 1)
    expect(modal.triggerJob).toHaveBeenCalledWith('job-1', VEHICLE_ID)
  })

  it('permite a un admin subir fotos a un vehículo ajeno', async () => {
    await controller.uploadVehicleImages(VEHICLE_ID, { id: 'otro-admin', role: 'admin' }, [file()])
    expect(upload.uploadMany).toHaveBeenCalled()
  })

  it('rechaza tipos de archivo no permitidos en reconstrucción', async () => {
    await expect(
      controller.uploadReconstructionImages(VEHICLE_ID, { id: 'owner', role: 'seller' }, [file('image/heic')]),
    ).rejects.toThrow('Tipo no permitido')
    expect(jobs.create).not.toHaveBeenCalled()
  })
})
