import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common'
import { ReportsService } from './reports.service'
import { CreateReportDto } from './dto/create-report.dto'

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.reportsService.findAllByUser(userId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateReportDto) {
    return this.reportsService.create(dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id)
  }

  @Delete(':reportId/items/:itemId')
  removeItem(
    @Param('reportId') reportId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.reportsService.removeItem(reportId, itemId)
  }

  @Put(':id/submit')
  submit(@Param('id') id: string) {
    return this.reportsService.submit(id)
  }
}
