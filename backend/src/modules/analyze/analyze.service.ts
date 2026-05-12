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
    const ocrText = await this.runOCR(imageBuffer)
    this.logger.debug(`OCR extracted ${ocrText.length} chars`)

    const parsed = await this.parseWithGemini(ocrText)
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

  private async runOCR(imageBuffer: Buffer): Promise<string> {
    const credPath = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS')
    if (!credPath) {
      this.logger.warn('GOOGLE_APPLICATION_CREDENTIALS not set – OCR skipped, returning empty text')
      return ''
    }

    try {
      const vision = await import('@google-cloud/vision')
      const client = new vision.ImageAnnotatorClient()
      const [result] = await client.textDetection({
        image: { content: imageBuffer.toString('base64') },
      })
      return result.textAnnotations?.[0]?.description ?? ''
    } catch (error) {
      this.logger.error('Vision API error', error)
      return ''
    }
  }

  private async parseWithGemini(ocrText: string): Promise<ParsedProduct[]> {
    if (!this.geminiModel) {
      this.logger.warn('Gemini not configured – returning empty product list')
      return []
    }

    if (!ocrText.trim()) {
      return []
    }

    const prompt = `
Você é especialista em leitura de etiquetas de supermercado brasileiro.
Texto OCR extraído de uma imagem de gôndola:

${ocrText}

Retorne APENAS um array JSON válido (sem markdown, sem explicações):
[{"produto":"nome normalizado","preco":0.00,"confianca":0}]

Regras OBRIGATÓRIAS:
- Inclua SOMENTE produtos com nome E preço claramente legíveis no OCR acima
- NÃO invente, complete ou suponha produtos que não estejam explicitamente no texto
- Ignore textos que não sejam nomes de produto ou preços (propagandas, números de corredor, etc.)
- Preço com ponto decimal (ex: 9.90)
- Confiança 0–100 baseada na clareza do texto OCR
- Se o OCR não contiver nenhum produto com preço identificável, retorne exatamente: []`

    try {
      const result = await this.geminiModel.generateContent(prompt)
      const text: string = result.response.text().trim()
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
