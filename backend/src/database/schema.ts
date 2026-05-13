import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  boolean,
  integer,
} from 'drizzle-orm/pg-core'

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  name: text('name').notNull(),
  city: text('city'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').references(() => stores.id),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  matricula: text('matricula'),
  role: text('role').notNull().default('auditor'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  ean: text('ean'),
  name: text('name').notNull(),
  brand: text('brand'),
  category: text('category'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const productPrices = pgTable('product_prices', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id),
  storeId: uuid('store_id').references(() => stores.id),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const auditReports = pgTable('audit_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  storeId: uuid('store_id').references(() => stores.id),
  corredor: text('corredor'),
  prateleira: text('prateleira'),
  imageUrl: text('image_url'),
  status: text('status').notNull().default('in_progress'),
  startedAt: timestamp('started_at').defaultNow(),
  finishedAt: timestamp('finished_at'),
})

export const auditItems = pgTable('audit_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id').references(() => auditReports.id),
  productId: uuid('product_id').references(() => products.id),
  name: text('name'),
  detectedPrice: numeric('detected_price', { precision: 10, scale: 2 }),
  correctPrice: numeric('correct_price', { precision: 10, scale: 2 }),
  confidence: integer('confidence'),
  issueType: text('issue_type').notNull().default('correct'),
  createdAt: timestamp('created_at').defaultNow(),
})

export type Company = typeof companies.$inferSelect
export type Store = typeof stores.$inferSelect
export type User = typeof users.$inferSelect
export type Product = typeof products.$inferSelect
export type ProductPrice = typeof productPrices.$inferSelect
export type AuditReport = typeof auditReports.$inferSelect
export type AuditItem = typeof auditItems.$inferSelect
