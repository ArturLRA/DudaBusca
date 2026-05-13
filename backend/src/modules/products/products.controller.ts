import { Controller, Get, Param, Query } from '@nestjs/common'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('search')
  search(@Query('q') query: string) {
    return this.productsService.search(query)
  }

  @Get('barcode/:ean')
  findByEan(@Param('ean') ean: string) {
    return this.productsService.findByEan(ean)
  }
}
