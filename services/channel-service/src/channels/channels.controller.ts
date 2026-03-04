import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { ListChannelsDto } from './dto/list-channels.dto';
import { MembershipDto } from './dto/membership.dto';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  create(@Body() dto: CreateChannelDto) {
    return this.channelsService.create(dto);
  }

  @Get()
  list(@Query() query: ListChannelsDto) {
    return this.channelsService.list(query.workspaceId, query.cursor, Number(query.limit ?? '50'));
  }

  @Post(':id/join')
  join(@Param('id') channelId: string, @Body() dto: MembershipDto) {
    return this.channelsService.join(channelId, dto.userId ?? 'anonymous-user');
  }

  @Post(':id/leave')
  leave(@Param('id') channelId: string, @Body() dto: MembershipDto) {
    return this.channelsService.leave(channelId, dto.userId ?? 'anonymous-user');
  }

  @Post(':id/archive')
  archive(@Param('id') channelId: string) {
    return this.channelsService.archive(channelId);
  }
}
