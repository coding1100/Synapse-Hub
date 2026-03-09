import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateDirectChannelDto } from './dto/create-direct-channel.dto';
import { ListChannelsDto } from './dto/list-channels.dto';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  create(@Body() dto: CreateChannelDto, @Headers('x-user-id') userId?: string) {
    return this.channelsService.create(dto, this.requireUserId(userId));
  }

  @Post('direct')
  createDirect(@Body() dto: CreateDirectChannelDto, @Headers('x-user-id') userId?: string) {
    return this.channelsService.createDirectChannel(dto.workspaceId, this.requireUserId(userId), dto.targetUserId);
  }

  @Get()
  list(@Query() query: ListChannelsDto, @Headers('x-user-id') userId?: string) {
    return this.channelsService.list(
      query.workspaceId,
      this.requireUserId(userId),
      query.cursor,
      Number(query.limit ?? '50'),
    );
  }

  @Post(':id/join')
  join(@Param('id') channelId: string, @Headers('x-user-id') userId?: string) {
    return this.channelsService.join(channelId, this.requireUserId(userId));
  }

  @Post(':id/leave')
  leave(
    @Param('id') channelId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.channelsService.leave(channelId, this.requireUserId(userId));
  }

  @Post(':id/archive')
  archive(@Param('id') channelId: string, @Headers('x-user-id') userId?: string) {
    return this.channelsService.archive(channelId, this.requireUserId(userId));
  }

  private requireUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    return userId;
  }
}
