import { Injectable } from '@nestjs/common'
import { ilike } from 'drizzle-orm'
import { db, products } from '../../database'

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
}
