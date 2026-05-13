import { Injectable, NotFoundException } from '@nestjs/common'
import { eq, desc, sql, inArray } from 'drizzle-orm'
import { db, auditReports, auditItems, users } from '../../database'
import { CreateReportDto } from './dto/create-report.dto'

export interface ReportSummary {
  totalReports: number
  totalItems: number
  byIssue: {
    correct: number
    wrong_price: number
    missing_label: number
    empty_shelf: number
    damaged_product: number
    wrong_label: number
    multiple_labels: number
    expired_product: number
    near_expiry: number
  }
  lastUpdated: string
}

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
          name: item.name,
          detectedPrice: item.detectedPrice,
          correctPrice: item.correctPrice ?? null,
          confidence: item.confidence ?? null,
          issueType: item.issueType ?? 'correct',
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

  async summary(userId: string): Promise<ReportSummary> {
    const emptyByIssue = {
      correct: 0,
      wrong_price: 0,
      missing_label: 0,
      empty_shelf: 0,
      damaged_product: 0,
      wrong_label: 0,
      multiple_labels: 0,
      expired_product: 0,
      near_expiry: 0,
    }

    const reports = await db
      .select({ id: auditReports.id })
      .from(auditReports)
      .where(eq(auditReports.userId, userId))

    if (reports.length === 0) {
      return {
        totalReports: 0,
        totalItems: 0,
        byIssue: emptyByIssue,
        lastUpdated: new Date().toISOString(),
      }
    }

    const reportIds = reports.map((r) => r.id)

    const counts = await db
      .select({
        issueType: auditItems.issueType,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(auditItems)
      .where(inArray(auditItems.reportId, reportIds))
      .groupBy(auditItems.issueType)

    const byIssue = { ...emptyByIssue }
    let totalItems = 0

    for (const row of counts) {
      const key = row.issueType as keyof typeof byIssue
      if (key in byIssue) {
        byIssue[key] = row.count
      }
      totalItems += row.count
    }

    return {
      totalReports: reports.length,
      totalItems,
      byIssue,
      lastUpdated: new Date().toISOString(),
    }
  }
}
