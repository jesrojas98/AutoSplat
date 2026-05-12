import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { MessagesService } from './messages.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Get()
  getAll(@CurrentUser() user: { id: string }) {
    return this.messages.getConversations(user.id)
  }

  @Post()
  send(
    @CurrentUser() user: { id: string },
    @Body() body: { receiver_id: string; vehicle_id: string; content: string },
  ) {
    return this.messages.sendMessage(user.id, body)
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.messages.markRead(id, user.id)
  }
}
