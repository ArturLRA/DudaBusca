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
  detectedPrice?: number | null
  correctPrice?: number
  hasDivergence?: boolean
  issueType?: IssueType
  confidence?: number
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

export interface BarcodeProduct {
  id: string
  ean: string
  name: string
  brand: string | null
  category: string | null
  price: number | null
}

export interface ReportSummary {
  totalReports: number
  totalItems: number
  byIssue: {
    correct: number
    wrong_price: number
    missing_label: number
    empty_shelf: number
    damaged_product: number
    wrong_label: number
    multiple_labels: number
    expired_product: number
    near_expiry: number
  }
  lastUpdated: string
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
  LiveVideo: undefined
  Report: { reportId?: string; analyzedItems?: AnalyzedItem[]; imageUri?: string }
  Submitted: undefined
  Profile: undefined
  Barcode: undefined
  Dashboard: undefined
}
