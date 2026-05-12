import 'dotenv/config'
import { db, companies, stores, users, products, productPrices } from './index'

async function seed() {
  console.log('🌱 Seeding database...')

  const [company] = await db
    .insert(companies)
    .values({ name: 'Rede SuperMais' })
    .returning()
  console.log('✓ Company created:', company.id)

  const [store] = await db
    .insert(stores)
    .values({ companyId: company.id, name: 'SuperMais Unidade Centro', city: 'São Paulo' })
    .returning()
  console.log('✓ Store created:', store.id)

  const [user] = await db
    .insert(users)
    .values({
      storeId: store.id,
      name: 'Duda Souza',
      email: 'duda.souza@supermais.com.br',
      matricula: '00284',
      role: 'conferente',
    })
    .returning()
  console.log('✓ User created:', user.id)

  const productData = [
    { name: 'Arroz Soltinho Dona Maria 1kg', brand: 'Dona Maria', category: 'Grãos', price: '26.90' },
    { name: 'Arroz Integral Camil 1kg', brand: 'Camil', category: 'Grãos', price: '24.50' },
    { name: 'Feijão Carioca Kicaldo 1kg', brand: 'Kicaldo', category: 'Grãos', price: '8.50' },
    { name: 'Macarrão Espaguete Renata 500g', brand: 'Renata', category: 'Massas', price: '4.99' },
    { name: 'Açúcar Refinado União 1kg', brand: 'União', category: 'Açúcar', price: '4.89' },
    { name: 'Óleo de Soja Liza 900ml', brand: 'Liza', category: 'Óleos', price: '8.99' },
    { name: 'Leite Integral Parmalat 1L', brand: 'Parmalat', category: 'Laticínios', price: '5.49' },
    { name: 'Café Pilão Tradicional 500g', brand: 'Pilão', category: 'Café', price: '16.90' },
    { name: 'Sabão em Pó Omo 1kg', brand: 'Omo', category: 'Limpeza', price: '19.90' },
    { name: 'Detergente Ypê 500ml', brand: 'Ypê', category: 'Limpeza', price: '2.49' },
  ]

  for (const p of productData) {
    const [product] = await db
      .insert(products)
      .values({ name: p.name, brand: p.brand, category: p.category })
      .returning()

    await db.insert(productPrices).values({
      productId: product.id,
      storeId: store.id,
      price: p.price,
    })
  }

  console.log(`✓ ${productData.length} products seeded`)
  console.log('\n✅ Seed complete!')
  console.log(`\nUser ID para testes: ${user.id}`)
  console.log(`Store ID para testes: ${store.id}`)
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
