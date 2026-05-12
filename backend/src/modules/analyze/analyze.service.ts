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
      this.logger.warn('GEMINI_API_KEY not set – using mock parsing in development')
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
    // Cloud Vision is initialized lazily to avoid startup errors when not configured.
    // In production, set GOOGLE_APPLICATION_CREDENTIALS env var.
    const credPath = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS')
    if (!credPath) {
      this.logger.warn('GOOGLE_APPLICATION_CREDENTIALS not set – using mock OCR')
      return this.mockOCRText()
    }

    try {
      // Dynamic import to avoid crash when credentials are missing
      const vision = await import('@google-cloud/vision')
      const client = new vision.ImageAnnotatorClient()
      const [result] = await client.textDetection({
        image: { content: imageBuffer.toString('base64') },
      })
      return result.textAnnotations?.[0]?.description ?? ''
    } catch (error) {
      this.logger.error('Vision API error, using mock OCR', error)
      return this.mockOCRText()
    }
  }

  private async parseWithGemini(ocrText: string): Promise<ParsedProduct[]> {
    if (!this.geminiModel) {
      return this.mockParsedProducts()
    }

    const prompt = `
Você é especialista em leitura de etiquetas de supermercado brasileiro.
Texto OCR de uma gôndola:

${ocrText}

Retorne APENAS um array JSON válido (sem markdown, sem explicações):
[{"produto":"nome normalizado","preco":0.00,"confianca":0}]

Regras: ignore propaganda e ruído; preço com ponto decimal; confiança 0–100; array vazio [] se não encontrar.`

    try {
      const result = await this.geminiModel.generateContent(prompt)
      const text: string = result.response.text().trim()
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) return []
      const parsed: ParsedProduct[] = JSON.parse(match[0])
      return parsed.filter((p) => p.confianca >= this.minConfidence)
    } catch (error) {
      this.logger.error('Gemini parse error', error)
      return this.mockParsedProducts()
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

  private mockOCRText(): string {
    return [
      'ARROZ SOLTINHO DONA MARIA 1KG',
      'R$ 29,90',
      'ARROZ INTEGRAL CAMIL 1KG',
      'R$ 24,50',
      'FEIJAO CARIOCA KICALDO 1KG',
      'R$ 9,90',
      'MACARAO ESPAGUETE RENATA 500G',
      'R$ 4,99',
      'ACUCAR REFINADO UNIAO 1KG',
      'R$ 5,49',
      'OLEO DE SOJA LIZA 900ML',
      'R$ 8,99',
    ].join('\n')
  }

  private mockParsedProducts(): ParsedProduct[] {
    return [
      { produto: 'Arroz Soltinho Dona Maria 1kg', preco: 29.90, confianca: 94 },
      { produto: 'Arroz Integral Camil 1kg', preco: 24.50, confianca: 91 },
      { produto: 'Feijão Carioca Kicaldo 1kg', preco: 9.90, confianca: 88 },
      { produto: 'Macarrão Espaguete Renata 500g', preco: 4.99, confianca: 90 },
      { produto: 'Açúcar Refinado União 1kg', preco: 5.49, confianca: 87 },
      { produto: 'Óleo de Soja Liza 900ml', preco: 8.99, confianca: 92 },
    ]
  }
}
