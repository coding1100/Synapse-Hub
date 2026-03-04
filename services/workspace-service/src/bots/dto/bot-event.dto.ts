import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class BotEventDto {
  @IsIn(['MESSAGE_CREATED', 'MESSAGE_REACTION', 'CHANNEL_JOINED', 'SLASH_COMMAND'])
  type!: 'MESSAGE_CREATED' | 'MESSAGE_REACTION' | 'CHANNEL_JOINED' | 'SLASH_COMMAND';

  @IsObject()
  payload!: Record<string, unknown>;

  @IsString()
  @IsOptional()
  actorId?: string;
}