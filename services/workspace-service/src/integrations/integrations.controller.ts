import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { ListIntegrationsDto } from './dto/list-integrations.dto';
import { IntegrationEventDto } from './dto/integration-event.dto';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post()
  create(@Body() dto: CreateIntegrationDto) {
    return this.integrationsService.create(dto);
  }

  @Get()
  list(@Query() query: ListIntegrationsDto) {
    return this.integrationsService.list(query.workspaceId, query.type);
  }

  @Post(':id/events/github')
  githubEvent(@Param('id') integrationId: string, @Body() dto: IntegrationEventDto) {
    return this.integrationsService.handleGithubEvent(
      integrationId,
      dto.event ?? 'github.event',
      dto.payload,
    );
  }

  @Post(':id/events/webhook')
  webhookEvent(@Param('id') integrationId: string, @Body() dto: IntegrationEventDto) {
    return this.integrationsService.handleWebhookEvent(integrationId, dto.payload);
  }

  @Post(':id/events/custom')
  customEvent(@Param('id') integrationId: string, @Body() dto: IntegrationEventDto) {
    return this.integrationsService.handleCustomEvent(
      integrationId,
      dto.event ?? 'custom.event',
      dto.payload,
    );
  }
}