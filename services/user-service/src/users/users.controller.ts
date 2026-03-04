import { Controller, Get, Headers, NotFoundException, Param, Patch, Query, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@Headers('x-user-id') userId?: string) {
    if (!userId) {
      throw new NotFoundException('Missing x-user-id header');
    }

    return this.usersService.getOrCreateUser(userId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.usersService.getById(id);
  }

  @Patch(':id')
  updateById(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateById(id, dto);
  }

  @Get()
  search(@Query() query: SearchUsersDto) {
    return this.usersService.search(query.q, query.cursor, Number(query.limit ?? '20'));
  }
}
