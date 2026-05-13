import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Fuse from 'fuse.js'
import { db, products, productPrices } from '../../database'
import { eq } from 'drizzle-orm'

export type IssueType =
  | 'correct'
  | 'wrong_price'
  | 'missing_label'
  | 'empty_shelf'
  | 'damaged_product'
  | 'wrong_label'
  | 'multiple_labels'
  | 'expired_product'
  | 'near_expiry'

type VisualIssueType = Exclude<IssueType, 'correct' | 'wrong_price'>

interface ParsedProduct {
  produto: string
  preco: number | null
  confianca: number
  issueType: VisualIssueType | null
  dataVencimento?: string
}

export interface AnalyzedItem {
  productId: string | null
  name: string
  detectedPrice: number | null
  correctPrice: number | null
  hasDivergence: boolean
  confidence: number
  matchScore: number
  issueType: IssueType
  dataVencimento?: string
}

@Injectable()
export class AnalyzeService {
  private readonly logger = new Logger(AnalyzeService.name)
  private readonly minConfidence: number
  private geminiModel: any

  constructor(private config: ConfigService) {
    this.minConfidence = this.config.get<number>('MIN_CONFIDENCE', 60)
    this.initGemini()
  }

  private initGemini() {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey)
      this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      this.logger.log('Gemini client initialized')
    } else {
      this.logger.warn('GEMINI_API_KEY not set – product parsing will return empty results')
    }
  }

  async analyze(imageBuffer: Buffer): Promise<{ items: AnalyzedItem[] }> {
    const parsed = await this.parseWithGemini(imageBuffer)
    this.logger.log(`Found ${parsed.length} items (including issues) above confidence threshold`)

    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        brand: products.brand,
        price: productPrices.price,
      })
      .from(products)
      .leftJoin(productPrices, eq(productPrices.productId, products.id))

    const items = this.matchProducts(parsed, allProducts)
    return { items }
  }

  private async parseWithGemini(imageBuffer: Buffer): Promise<ParsedProduct[]> {
    if (!this.geminiModel) {
      this.logger.warn('Gemini not configured – returning empty product list')
      return []
    }

    const prompt = `
Você é especialista em auditoria de gôndolas de supermercado brasileiro.
Analise esta imagem de gôndola/prateleira e identifique TODOS os itens e problemas visíveis.

Retorne APENAS um array JSON válido (sem markdown, sem explicações):
[{"produto":"nome normalizado","preco":9.90,"confianca":85,"issueType":null,"dataVencimento":null}]

TIPOS DE PROBLEMA ("issueType") — defina null para produto OK com etiqueta legível:
- null              → produto OK, preço visível e legível (backend verificará se o preço está correto)
- "missing_label"   → produto presente mas SEM etiqueta de preço ou etiqueta em branco/ilegível
- "empty_shelf"     → espaço VAZIO na gôndola onde deveria haver produto
- "damaged_product" → embalagem danificada (amassada, rasgada, aberta, vazando)
- "wrong_label"     → etiqueta claramente de produto DIFERENTE do que está exposto
- "multiple_labels" → DUAS ou mais etiquetas de preços DIFERENTES para o mesmo espaço
- "expired_product" → data de validade VENCIDA visível na embalagem
- "near_expiry"     → produto vence em até 7 dias (data visível na embalagem)

REGRAS OBRIGATÓRIAS:
- "preco": null quando sem etiqueta, espaço vazio ou preço ilegível
- "preco": valor numérico quando visível (ex: 9.90)
- "issueType": null para produto normal com etiqueta OK
- "produto": normalize o nome (ex: "QJ PARMESAO" → "Queijo Parmesão")
- Para "empty_shelf": "produto" descreve a localização (ex: "Vaga vazia - Biscoitos")
- "dataVencimento": formato "YYYY-MM-DD", apenas para expired_product ou near_expiry
- "confianca": 0–100 baseado na clareza visual
- Inclua TODOS os itens e problemas visíveis, mesmo com confiança menor
- Se nada identificável, retorne exatamente: []`

    try {
      const result = await this.geminiModel.generateContent([
        { inlineData: { mimeType: 'image/jpeg', data: imageBuffer.toString('base64') } },
        prompt,
      ])
      const text: string = result.response.text().trim()
      this.logger.debug(`Gemini raw response: ${text.slice(0, 300)}`)
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) return []
      const parsed: ParsedProduct[] = JSON.parse(match[0])
      return parsed.filter((p) => p.confianca >= this.minConfidence)
    } catch (error) {
      this.logger.error('Gemini parse error', error)
      return []
    }
  }

  private matchProducts(
    parsed: ParsedProduct[],
    dbProducts: { id: string; name: string; brand: string | null; price: string | null }[],
  ): AnalyzedItem[] {
    const fuse = new Fuse(dbProducts, {
      keys: ['name', 'brand'],
      threshold: 0.45,
      includeScore: true,
    })

    return parsed.map((p) => {
      // Visual issue detected — return immediately without DB price comparison
      if (p.issueType !== null && p.issueType !== undefined) {
        return {
          productId: null,
          name: p.produto,
          detectedPrice: p.preco,
          correctPrice: null,
          hasDivergence: true,
          confidence: p.confianca,
          matchScore: 0,
          issueType: p.issueType as IssueType,
          dataVencimento: p.dataVencimento,
        }
      }

      // No visual issue — compare against DB to determine correct vs wrong_price
      const matches = fuse.search(p.produto)
      const best = matches[0]

      if (!best) {
        return {
          productId: null,
          name: p.produto,
          detectedPrice: p.preco,
          correctPrice: null,
          hasDivergence: false,
          confidence: p.confianca,
          matchScore: 0,
          issueType: 'correct' as IssueType,
        }
      }

      const correctPrice = best.item.price ? parseFloat(best.item.price) : null
      const matchScore = Math.round((1 - (best.score ?? 1)) * 100)
      const hasPriceDivergence =
        correctPrice !== null &&
        p.preco !== null &&
        Math.abs(correctPrice - p.preco) > 0.01

      return {
        productId: best.item.id,
        name: best.item.name,
        detectedPrice: p.preco,
        correctPrice,
        hasDivergence: hasPriceDivergence,
        confidence: p.confianca,
        matchScore,
        issueType: (hasPriceDivergence ? 'wrong_price' : 'correct') as IssueType,
      }
    })
  }
}
