import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')

  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  })

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  console.log(`AutoSplat API corriendo en http://localhost:${port}/api`)
}
bootstrap()
