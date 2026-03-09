import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { CreateInviteLinkDto } from './dto/create-invite-link.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ListWorkspacesDto } from './dto/list-workspaces.dto';
import { UpdateWorkspaceRoleDto } from './dto/update-workspace-role.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@Body() dto: CreateWorkspaceDto, @Headers('x-user-id') userId?: string) {
    return this.workspacesService.create(dto, this.requireUserId(userId));
  }

  @Get()
  list(@Query() query: ListWorkspacesDto, @Headers('x-user-id') userId?: string) {
    return this.workspacesService.list(this.requireUserId(userId), query.cursor, Number(query.limit ?? '20'));
  }

  @Get(':id/members')
  members(@Param('id') workspaceId: string, @Headers('x-user-id') userId?: string) {
    return this.workspacesService.members(workspaceId, this.requireUserId(userId));
  }

  @Post(':id/invite')
  invite(
    @Param('id') workspaceId: string,
    @Body() dto: InviteMemberDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.workspacesService.invite(
      workspaceId,
      dto.email,
      dto.role ?? 'MEMBER',
      this.requireUserId(userId),
    );
  }

  @Post(':id/invite-links')
  createInviteLink(
    @Param('id') workspaceId: string,
    @Body() dto: CreateInviteLinkDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.workspacesService.createInviteLink(workspaceId, this.requireUserId(userId), dto);
  }

  @Get(':id/invite-links')
  listInviteLinks(@Param('id') workspaceId: string, @Headers('x-user-id') userId?: string) {
    return this.workspacesService.listInviteLinks(workspaceId, this.requireUserId(userId));
  }

  @Post(':id/invite-links/:inviteLinkId/revoke')
  revokeInviteLink(
    @Param('id') workspaceId: string,
    @Param('inviteLinkId') inviteLinkId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.workspacesService.revokeInviteLink(workspaceId, inviteLinkId, this.requireUserId(userId));
  }

  @Post('invite-links/:code/accept')
  acceptInviteLink(@Param('code') code: string, @Headers('x-user-id') userId?: string) {
    return this.workspacesService.acceptInviteLink(code, this.requireUserId(userId));
  }

  @Patch(':id/members/:userId/role')
  setRole(
    @Param('id') workspaceId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateWorkspaceRoleDto,
    @Headers('x-user-id') actorId?: string,
  ) {
    return this.workspacesService.setRole(
      workspaceId,
      userId,
      dto.role,
      this.requireUserId(actorId),
    );
  }

  private requireUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    return userId;
  }
}
