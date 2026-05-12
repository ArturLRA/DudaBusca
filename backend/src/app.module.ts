import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AnalyzeModule } from './modules/analyze/analyze.module'
import { ReportsModule } from './modules/reports/reports.module'
import { ProductsModule } from './modules/products/products.module'
import { HealthModule } from './health/health.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    AnalyzeModule,
    ReportsModule,
    ProductsModule,
  ],
})
export class AppModule {}
