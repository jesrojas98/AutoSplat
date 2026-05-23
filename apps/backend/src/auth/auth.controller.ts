import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { RateLimitGuard, RateLimit } from '../common/guards/rate-limit.guard'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @RateLimit(5, 60_000) // 5 registros por minuto por IP
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimit(10, 60_000) // 10 intentos por minuto por IP
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }
}
