import { IsObject, IsOptional, IsString } from 'class-validator';

export class IntegrationEventDto {
  @IsString()
  @IsOptional()
  event?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}