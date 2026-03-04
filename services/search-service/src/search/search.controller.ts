import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { IndexDocumentDto } from './dto/index-document.dto';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('index')
  index(@Body() dto: IndexDocumentDto) {
    return this.searchService.index(dto);
  }

  @Get()
  query(@Query() query: SearchQueryDto) {
    return this.searchService.search(
      query.workspaceId,
      query.q,
      query.type,
      query.cursor,
      Number(query.limit ?? '20'),
    );
  }
}
