import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  upload(@Body() dto: UploadFileDto, @Headers('x-user-id') userId?: string) {
    return this.filesService.upload(dto, this.requireUserId(userId));
  }

  @Get(':id')
  get(@Param('id') fileId: string, @Headers('x-user-id') userId?: string) {
    return this.filesService.get(fileId, this.requireUserId(userId));
  }

  @Delete(':id')
  remove(@Param('id') fileId: string, @Headers('x-user-id') userId?: string) {
    return this.filesService.remove(fileId, this.requireUserId(userId));
  }

  private requireUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    return userId;
  }
}
