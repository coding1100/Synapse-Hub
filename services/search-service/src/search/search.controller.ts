import { Body, Controller, Get, Headers, Post, Query, UnauthorizedException } from '@nestjs/common';
import { SearchService } from './search.service';
import { IndexDocumentDto } from './dto/index-document.dto';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('index')
  index(@Body() dto: IndexDocumentDto, @Headers('x-user-id') userId?: string) {
    return this.searchService.index(dto, this.requireUserId(userId));
  }

  @Get()
  query(@Query() query: SearchQueryDto, @Headers('x-user-id') userId?: string) {
    return this.searchService.search(
      query.workspaceId,
      query.q,
      query.type,
      query.cursor,
      Number(query.limit ?? '20'),
      this.requireUserId(userId),
    );
  }

  private requireUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    return userId;
  }
}
