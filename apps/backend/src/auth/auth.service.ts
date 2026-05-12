import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { UsersService } from '../users/users.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email)
    if (existing) throw new ConflictException('El correo ya está registrado')

    const hash = await bcrypt.hash(dto.password, 10)
    const user = await this.users.create({ ...dto, password: hash })

    return this.buildResponse(user)
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email)
    if (!user) throw new UnauthorizedException('Credenciales incorrectas')

    const valid = await bcrypt.compare(dto.password, user.password_hash)
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas')

    return this.buildResponse(user)
  }

  private buildResponse(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role }
    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    }
  }
}
