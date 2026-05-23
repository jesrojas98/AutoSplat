import { IsString, IsUUID, IsNotEmpty, MaxLength, MinLength } from 'class-validator'

export class SendMessageDto {
  @IsUUID()
  receiver_id: string

  @IsUUID()
  vehicle_id: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content: string
}
