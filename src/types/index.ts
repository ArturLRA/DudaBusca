export interface Report {
  id: string
  corredor: string
  prateleira: string
  date: string
  time: string
  itemCount: number
  imageUri?: string
  status: 'draft' | 'sent'
}

export interface Product {
  id: string
  name: string
  corredor: string
  prateleira: string
  detectedPrice?: number
  correctPrice?: number
  hasDivergence?: boolean
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

export interface User {
  name: string
  initials: string
  matricula: string
  role: string
  totalSent: number
  approvalRate: number
}

export type RootStackParamList = {
  Home: undefined
  NewReport: undefined
  Report: { reportId?: string; analyzedItems?: AnalyzedItem[]; imageUri?: string }
  Submitted: undefined
  Profile: undefined
}
