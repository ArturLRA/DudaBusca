import { IsString, IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateAuditItemDto {
  @IsUUID()
  @IsOptional()
  productId?: string

  @IsString()
  name: string

  @IsString()
  detectedPrice: string

  @IsString()
  @IsOptional()
  correctPrice?: string

  @IsOptional()
  confidence?: number
}

export class CreateReportDto {
  @IsUUID()
  userId: string

  @IsUUID()
  @IsOptional()
  storeId?: string

  @IsString()
  @IsOptional()
  corredor?: string

  @IsString()
  @IsOptional()
  prateleira?: string

  @IsString()
  @IsOptional()
  imageUrl?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAuditItemDto)
  items: CreateAuditItemDto[]
}
