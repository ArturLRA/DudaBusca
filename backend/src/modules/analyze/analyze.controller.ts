import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { AnalyzeService } from './analyze.service'

@Controller('analyze')
export class AnalyzeController {
  private readonly logger = new Logger(AnalyzeController.name)

  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async analyzeImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Campo "image" é obrigatório.')
    }

    this.logger.log(`Analisando imagem: ${file.originalname} (${file.size} bytes)`)

    try {
      return await this.analyzeService.analyze(file.buffer)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      this.logger.error('Analyze failed: ' + msg, error instanceof Error ? error.stack : undefined)
      throw error
    }
  }
}
