import { Controller, Get, Query } from '@nestjs/common';
import { VideoService } from './video.service';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get('signed-url')
  getSignedUrl(@Query('filename') filename: string) {
    return this.videoService.generateSignedUrl(filename);
  }
}
