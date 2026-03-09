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
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { ListIntegrationsDto } from './dto/list-integrations.dto';
import { IntegrationEventDto } from './dto/integration-event.dto';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post()
  create(@Body() dto: CreateIntegrationDto, @Headers('x-user-id') userId?: string) {
    return this.integrationsService.create({
      ...dto,
      createdById: this.requireUserId(userId),
    });
  }

  @Get()
  list(@Query() query: ListIntegrationsDto, @Headers('x-user-id') userId?: string) {
    return this.integrationsService.list(query.workspaceId, this.requireUserId(userId), query.type);
  }

  @Post(':id/events/webhook')
  webhookEvent(
    @Param('id') integrationId: string,
    @Body() dto: IntegrationEventDto,
    @Headers('x-integration-secret') integrationSecret?: string,
  ) {
    return this.integrationsService.handleWebhookEvent(
      integrationId,
      dto.payload,
      this.requireIntegrationSecret(integrationSecret),
    );
  }

  @Post(':id/events/custom')
  customEvent(
    @Param('id') integrationId: string,
    @Body() dto: IntegrationEventDto,
    @Headers('x-integration-secret') integrationSecret?: string,
  ) {
    return this.integrationsService.handleCustomEvent(
      integrationId,
      dto.event ?? 'custom.event',
      dto.payload,
      this.requireIntegrationSecret(integrationSecret),
    );
  }

  private requireUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    return userId;
  }

  private requireIntegrationSecret(secret?: string) {
    if (!secret) {
      throw new UnauthorizedException('Missing x-integration-secret header');
    }

    return secret;
  }
}
