import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { eq, ilike } from 'drizzle-orm'
import { db, products, productPrices } from '../../database'

interface OpenFoodFactsProduct {
  product_name?: string
  product_name_pt?: string
  brands?: string
  categories?: string
  image_url?: string
  quantity?: string
}

export interface BarcodeResult {
  source: 'local' | 'open_food_facts'
  id: string | null
  ean: string
  name: string
  brand: string | null
  category: string | null
  quantity: string | null
  price: number | null
  imageUrl: string | null
  inLocalCatalog: boolean
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name)

  async search(query: string) {
    if (!query || query.trim().length < 2) {
      return db.select().from(products).limit(20)
    }

    return db
      .select()
      .from(products)
      .where(ilike(products.name, `%${query}%`))
      .limit(20)
  }

  async findByEan(ean: string): Promise<BarcodeResult> {
    // 1. Check local catalog first
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.ean, ean))

    if (product) {
      const [priceRow] = await db
        .select({ price: productPrices.price })
        .from(productPrices)
        .where(eq(productPrices.productId, product.id))

      return {
        source: 'local',
        id: product.id,
        ean,
        name: product.name,
        brand: product.brand,
        category: product.category,
        quantity: null,
        price: priceRow ? parseFloat(priceRow.price) : null,
        imageUrl: null,
        inLocalCatalog: true,
      }
    }

    // 2. Fallback to Open Food Facts
    this.logger.log(`EAN ${ean} not in local catalog, querying Open Food Facts`)
    const off = await this.lookupOpenFoodFacts(ean)

    if (off) {
      const name =
        off.product_name_pt?.trim() ||
        off.product_name?.trim() ||
        `Produto ${ean}`

      return {
        source: 'open_food_facts',
        id: null,
        ean,
        name,
        brand: off.brands?.split(',')[0]?.trim() ?? null,
        category: off.categories?.split(',')[0]?.trim() ?? null,
        quantity: off.quantity ?? null,
        price: null,
        imageUrl: off.image_url ?? null,
        inLocalCatalog: false,
      }
    }

    throw new NotFoundException(`Produto com EAN ${ean} não encontrado`)
  }

  private async lookupOpenFoodFacts(ean: string): Promise<OpenFoodFactsProduct | null> {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${ean}.json`,
        { headers: { 'User-Agent': 'DudaBusca/1.0 (price-audit-app)' } },
      )
      if (!res.ok) return null
      const data = await res.json() as { status: number; product?: OpenFoodFactsProduct }
      if (data.status === 0 || !data.product) return null
      return data.product
    } catch (err) {
      this.logger.warn(`Open Food Facts lookup failed for EAN ${ean}: ${err}`)
      return null
    }
  }
}
