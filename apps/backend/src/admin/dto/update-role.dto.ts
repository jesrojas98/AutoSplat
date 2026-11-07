import { IsIn } from 'class-validator'

export const ROLES = ['buyer', 'seller', 'admin'] as const
export type Role = (typeof ROLES)[number]

export class UpdateRoleDto {
  @IsIn(ROLES, { message: 'Rol inválido' })
  role: Role
}
