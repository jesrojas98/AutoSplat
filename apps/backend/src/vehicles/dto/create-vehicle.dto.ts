import { IsString, IsInt, IsNotEmpty, IsOptional, Min, Max, IsIn } from 'class-validator'

export class CreateVehicleDto {
  @IsString() @IsNotEmpty() brand: string
  @IsString() @IsNotEmpty() model: string
  @IsInt() @Min(1900) @Max(2030) year: number
  @IsInt() @Min(1) price: number
  @IsInt() @Min(0) mileage: number
  @IsString() @IsNotEmpty() location: string

  @IsOptional() @IsIn(['manual', 'automatic', 'cvt']) transmission?: string
  @IsOptional() @IsIn(['gasoline', 'diesel', 'electric', 'hybrid']) fuel_type?: string
  @IsOptional() @IsString() body_type?: string
  @IsOptional() @IsString() color?: string
  @IsOptional() @IsInt() doors?: number
  @IsOptional() @IsString() region?: string
  @IsOptional() @IsString() description?: string
}
