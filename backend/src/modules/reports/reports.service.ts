import { Injectable, NotFoundException } from '@nestjs/common'
import { eq, desc } from 'drizzle-orm'
import { db, auditReports, auditItems, users, products } from '../../database'
import { CreateReportDto } from './dto/create-report.dto'

@Injectable()
export class ReportsService {
  async findAllByUser(userId: string) {
    const reports = await db
      .select()
      .from(auditReports)
      .where(eq(auditReports.userId, userId))
      .orderBy(desc(auditReports.startedAt))

    const withCounts = await Promise.all(
      reports.map(async (r) => {
        const items = await db
          .select()
          .from(auditItems)
          .where(eq(auditItems.reportId, r.id))
        return { ...r, itemCount: items.length }
      }),
    )

    return withCounts
  }

  async findOne(id: string) {
    const [report] = await db
      .select()
      .from(auditReports)
      .where(eq(auditReports.id, id))

    if (!report) throw new NotFoundException(`Relatório ${id} não encontrado`)

    const items = await db
      .select()
      .from(auditItems)
      .where(eq(auditItems.reportId, id))

    return { ...report, items }
  }

  async create(dto: CreateReportDto) {
    let storeId = dto.storeId
    if (!storeId) {
      const [user] = await db.select().from(users).where(eq(users.id, dto.userId))
      storeId = user?.storeId ?? undefined
    }

    const [report] = await db
      .insert(auditReports)
      .values({
        userId: dto.userId,
        storeId: storeId ?? null,
        corredor: dto.corredor,
        prateleira: dto.prateleira,
        imageUrl: dto.imageUrl,
        status: 'in_progress',
      })
      .returning()

    if (dto.items.length > 0) {
      await db.insert(auditItems).values(
        dto.items.map((item) => ({
          reportId: report.id,
          productId: item.productId ?? null,
          detectedPrice: item.detectedPrice,
          correctPrice: item.correctPrice ?? null,
          confidence: item.confidence ?? null,
          status: item.correctPrice && item.detectedPrice !== item.correctPrice
            ? 'incorrect_price'
            : 'confirmed',
        })),
      )
    }

    return report
  }

  async remove(id: string) {
    const [report] = await db
      .select()
      .from(auditReports)
      .where(eq(auditReports.id, id))

    if (!report) throw new NotFoundException(`Relatório ${id} não encontrado`)

    await db.delete(auditItems).where(eq(auditItems.reportId, id))
    await db.delete(auditReports).where(eq(auditReports.id, id))
    return { success: true }
  }

  async removeItem(reportId: string, itemId: string) {
    const [existing] = await db
      .select()
      .from(auditItems)
      .where(eq(auditItems.id, itemId))

    if (!existing || existing.reportId !== reportId) {
      throw new NotFoundException('Item não encontrado')
    }

    await db.delete(auditItems).where(eq(auditItems.id, itemId))
    return { success: true }
  }

  async submit(id: string) {
    const [report] = await db
      .select()
      .from(auditReports)
      .where(eq(auditReports.id, id))

    if (!report) throw new NotFoundException(`Relatório ${id} não encontrado`)

    const [updated] = await db
      .update(auditReports)
      .set({ status: 'completed', finishedAt: new Date() })
      .where(eq(auditReports.id, id))
      .returning()

    return updated
  }
}
