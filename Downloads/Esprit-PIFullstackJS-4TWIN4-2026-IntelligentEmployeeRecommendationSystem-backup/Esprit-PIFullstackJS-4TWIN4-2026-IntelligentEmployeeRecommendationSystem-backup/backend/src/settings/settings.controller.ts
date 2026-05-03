import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  async get(@Param('key') key: string) {
    return this.settingsService.get(key);
  }

  @Post()
  async set(@Body('key') key: string, @Body('value') value: any) {
    return this.settingsService.set(key, value);
  }
}
