import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator'

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string

  @IsEmail({}, { message: 'Correo electrónico inválido' })
  @MaxLength(254)
  email: string

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe incluir letras y números',
  })
  password: string

  @IsOptional()
  @IsIn(['buyer', 'seller'], { message: 'Rol inválido' })
  role?: 'buyer' | 'seller'
}
