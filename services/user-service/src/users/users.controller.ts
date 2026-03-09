import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@Headers('x-user-id') userId?: string) {
    return this.usersService.getOrCreateUser(this.requireUserId(userId));
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.usersService.getById(id);
  }

  @Patch(':id')
  updateById(@Param('id') id: string, @Body() dto: UpdateUserDto, @Headers('x-user-id') requesterId?: string) {
    const currentUserId = this.requireUserId(requesterId);
    if (currentUserId !== id) {
      throw new ForbiddenException('Users can only update their own profile');
    }

    return this.usersService.updateById(id, dto);
  }

  @Get()
  search(@Query() query: SearchUsersDto, @Headers('x-user-id') userId?: string) {
    return this.usersService.search(
      query.q,
      query.cursor,
      Number(query.limit ?? '20'),
      query.workspaceId,
      userId,
    );
  }

  private requireUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    return userId;
  }
}
