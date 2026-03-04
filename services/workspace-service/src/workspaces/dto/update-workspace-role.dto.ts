import { IsIn } from 'class-validator';

export class UpdateWorkspaceRoleDto {
  @IsIn(['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])
  role!: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
}
