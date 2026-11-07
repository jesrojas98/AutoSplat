import { ValidationPipe, BadRequestException } from '@nestjs/common'
import { UpdateVehicleDto } from '../vehicles/dto/update-vehicle.dto'

// Misma configuración que app.module.ts
const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
const run = (body: unknown) => pipe.transform(body, { type: 'body', metatype: UpdateVehicleDto })

describe('UpdateVehicleDto (PATCH /vehicles/:id)', () => {
  it('acepta exactamente lo que envía la pantalla de edición', async () => {
    const body = {
      brand: 'Toyota', model: 'Corolla', year: 2022, price: 15000000, mileage: 20000,
      transmission: 'automatic', fuel_type: 'gasoline', body_type: 'sedan', color: 'Blanco',
      doors: 4, location: 'Santiago', region: 'Metropolitana', description: 'ok', status: 'published',
    }
    await expect(run(body)).resolves.toMatchObject({ brand: 'Toyota', status: 'published' })
  })

  it('acepta un cambio parcial (solo el precio)', async () => {
    await expect(run({ price: 9000000 })).resolves.toMatchObject({ price: 9000000 })
  })

  it.each([
    ['seller_id', { seller_id: 'otro' }],
    ['views_count', { views_count: 99999 }],
    ['has_3d_model', { has_3d_model: true }],
    ['id', { id: 'x' }],
  ])('rechaza el campo ajeno %s', async (_name, body) => {
    await expect(run(body)).rejects.toBeInstanceOf(BadRequestException)
  })

  it.each([{ status: 'processing_3d' }, { status: 'hacked' }, { price: -5 }, { year: 1800 }, { transmission: 'x' }])(
    'rechaza valores inválidos %j',
    async (body) => {
      await expect(run(body)).rejects.toBeInstanceOf(BadRequestException)
    },
  )
})
