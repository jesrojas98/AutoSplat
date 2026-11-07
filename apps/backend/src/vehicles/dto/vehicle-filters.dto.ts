import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * Query string de GET /vehicles. Los parámetros llegan como texto, así que se
 * convierten a número aquí (antes `page`/`limit` se concatenaban como strings
 * y la paginación devolvía filas de más).
 */
export class VehicleFiltersDto {
  @IsOptional() @IsString() @MaxLength(50) brand?: string
  @IsOptional() @IsString() @MaxLength(100) search?: string
  @IsOptional() @IsString() @MaxLength(100) location?: string
  @IsOptional() @IsString() @MaxLength(20) transmission?: string
  @IsOptional() @IsString() @MaxLength(20) fuel_type?: string

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(999_999_999) minPrice?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(999_999_999) maxPrice?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100) minYear?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100) maxYear?: number

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10_000) page?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number
}
