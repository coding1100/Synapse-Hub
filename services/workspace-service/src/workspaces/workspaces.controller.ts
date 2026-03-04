import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateWorkspaceRoleDto } from './dto/update-workspace-role.dto';
import { ListWorkspacesDto } from './dto/list-workspaces.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@Body() dto: CreateWorkspaceDto, @Headers('x-user-id') userId?: string) {
    return this.workspacesService.create(dto, userId ?? 'system-user');
  }

  @Get()
  list(@Query() query: ListWorkspacesDto) {
    return this.workspacesService.list(query.cursor, Number(query.limit ?? '20'));
  }

  @Get(':id/members')
  members(@Param('id') workspaceId: string) {
    return this.workspacesService.members(workspaceId);
  }

  @Post(':id/invite')
  invite(@Param('id') workspaceId: string, @Body() dto: InviteMemberDto) {
    return this.workspacesService.invite(workspaceId, dto.email, dto.role ?? 'MEMBER');
  }

  @Patch(':id/members/:userId/role')
  setRole(
    @Param('id') workspaceId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateWorkspaceRoleDto,
  ) {
    return this.workspacesService.setRole(workspaceId, userId, dto.role);
  }
}
