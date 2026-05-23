import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { MessagesService } from './messages.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RateLimit } from '../common/guards/rate-limit.guard'
import { SendMessageDto } from './dto/send-message.dto'

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Get()
  getAll(@CurrentUser() user: { id: string }) {
    return this.messages.getConversations(user.id)
  }

  @Post()
  @RateLimit(20, 60_000) // 20 mensajes por minuto por IP
  send(
    @CurrentUser() user: { id: string },
    @Body() body: SendMessageDto,
  ) {
    return this.messages.sendMessage(user.id, body)
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.messages.markRead(id, user.id)
  }
}
