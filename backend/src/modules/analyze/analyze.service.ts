import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Fuse from 'fuse.js'
import { db, products, productPrices } from '../../database'
import { eq } from 'drizzle-orm'

interface ParsedProduct {
  produto: string
  preco: number
  confianca: number
}

export interface AnalyzedItem {
  productId: string | null
  name: string
  detectedPrice: number
  correctPrice: number | null
  hasDivergence: boolean
  confidence: number
  matchScore: number
}

@Injectable()
export class AnalyzeService {
  private readonly logger = new Logger(AnalyzeService.name)
  private readonly minConfidence: number
  private geminiModel: any

  constructor(private config: ConfigService) {
    this.minConfidence = this.config.get<number>('MIN_CONFIDENCE', 75)
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
    this.logger.log(`Found ${parsed.length} products above confidence threshold`)

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
Você é especialista em leitura de etiquetas de supermercado brasileiro.
Analise esta imagem de gôndola/prateleira de supermercado.

Retorne APENAS um array JSON válido (sem markdown, sem explicações):
[{"produto":"nome normalizado","preco":0.00,"confianca":0}]

Regras OBRIGATÓRIAS:
- Inclua SOMENTE produtos com nome E preço claramente visíveis na imagem
- NÃO invente produtos que não estejam visíveis
- Normalize o nome: ex "QJ PARMESAO" → "Queijo Parmesão"
- Preço com ponto decimal (ex: 9.90)
- Confiança 0–100 baseada na clareza do texto na imagem
- Se não houver nenhum produto com preço identificável, retorne exatamente: []`

    try {
      const result = await this.geminiModel.generateContent([
        { inlineData: { mimeType: 'image/jpeg', data: imageBuffer.toString('base64') } },
        prompt,
      ])
      const text: string = result.response.text().trim()
      this.logger.debug(`Gemini raw response: ${text.slice(0, 200)}`)
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
        }
      }

      const correctPrice = best.item.price ? parseFloat(best.item.price) : null
      const matchScore = Math.round((1 - (best.score ?? 1)) * 100)

      return {
        productId: best.item.id,
        name: best.item.name,
        detectedPrice: p.preco,
        correctPrice,
        hasDivergence: correctPrice !== null && Math.abs(correctPrice - p.preco) > 0.01,
        confidence: p.confianca,
        matchScore,
      }
    })
  }

}
