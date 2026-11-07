import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')

  // FRONTEND_URL admite varias URLs separadas por coma y "*" como comodín
  // (p. ej. https://auto-splat*.vercel.app), porque Vercel sirve el mismo
  // proyecto en varios dominios (producción, rama, previews).
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
    .map((origin) =>
      origin.includes('*')
        ? new RegExp('^' + origin.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]*') + '$')
        : origin,
    )

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  })

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  console.log(`AutoSplat API corriendo en http://localhost:${port}/api`)
}
bootstrap()
