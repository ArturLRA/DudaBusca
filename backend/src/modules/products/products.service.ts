import { Injectable, NotFoundException } from '@nestjs/common'
import { eq, ilike } from 'drizzle-orm'
import { db, products, productPrices } from '../../database'

@Injectable()
export class ProductsService {
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

  async findByEan(ean: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.ean, ean))

    if (!product) {
      throw new NotFoundException(`Produto com EAN ${ean} não encontrado`)
    }

    const [priceRow] = await db
      .select({ price: productPrices.price })
      .from(productPrices)
      .where(eq(productPrices.productId, product.id))

    return {
      ...product,
      price: priceRow ? parseFloat(priceRow.price) : null,
    }
  }
}
