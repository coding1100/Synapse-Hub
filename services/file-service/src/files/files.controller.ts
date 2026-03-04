import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  upload(@Body() dto: UploadFileDto) {
    return this.filesService.upload(dto);
  }

  @Get(':id')
  get(@Param('id') fileId: string) {
    return this.filesService.get(fileId);
  }

  @Delete(':id')
  remove(@Param('id') fileId: string) {
    return this.filesService.remove(fileId);
  }
}
