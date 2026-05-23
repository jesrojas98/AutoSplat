import { IsString, IsOptional, MaxLength, MinLength, IsUrl, Matches } from 'class-validator'

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s\-()]{7,20}$/, { message: 'Número de teléfono inválido' })
  phone?: string

  @IsOptional()
  @IsUrl({}, { message: 'URL de avatar inválida' })
  @MaxLength(500)
  avatar_url?: string
}
