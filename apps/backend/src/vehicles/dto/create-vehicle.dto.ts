import { IsString, IsInt, IsNotEmpty, IsOptional, Min, Max, IsIn, MaxLength, MinLength } from 'class-validator'
import { Transform } from 'class-transformer'

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))

export class CreateVehicleDto {
  @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(50) @trim() brand: string
  @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(80) @trim() model: string
  @IsInt() @Min(1900) @Max(new Date().getFullYear() + 1) year: number
  @IsInt() @Min(1) @Max(999_999_999) price: number
  @IsInt() @Min(0) @Max(2_000_000) mileage: number
  @IsString() @IsNotEmpty() @MaxLength(100) @trim() location: string

  @IsOptional() @IsIn(['manual', 'automatic', 'cvt']) transmission?: string
  @IsOptional() @IsIn(['gasoline', 'diesel', 'electric', 'hybrid']) fuel_type?: string
  @IsOptional() @IsString() @MaxLength(50) @trim() body_type?: string
  @IsOptional() @IsString() @MaxLength(50) @trim() color?: string
  @IsOptional() @IsInt() @Min(1) @Max(10) doors?: number
  @IsOptional() @IsString() @MaxLength(100) @trim() region?: string
  @IsOptional() @IsString() @MaxLength(5000) @trim() description?: string
}
