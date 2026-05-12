const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api'

interface AnalyzedItem {
  productId: string | null
  name: string
  detectedPrice: number
  correctPrice: number | null
  hasDivergence: boolean
  confidence: number
  matchScore: number
}

interface ApiReport {
  id: string
  userId: string
  storeId: string
  corredor: string | null
  prateleira: string | null
  imageUrl: string | null
  status: string
  startedAt: string
  finishedAt: string | null
  itemCount?: number
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  analyze: async (imageUri: string): Promise<{ items: AnalyzedItem[] }> => {
    const formData = new FormData()
    const filename = imageUri.split('/').pop() ?? 'photo.jpg'

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: 'image/jpeg',
    } as unknown as Blob)

    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      throw new Error(`Analyze error ${res.status}`)
    }

    return res.json()
  },

  reports: {
    list: (userId: string) =>
      request<ApiReport[]>(`/reports?userId=${encodeURIComponent(userId)}`),

    get: (id: string) =>
      request<ApiReport & { items: unknown[] }>(`/reports/${id}`),

    create: (payload: {
      userId: string
      storeId: string
      corredor?: string
      prateleira?: string
      imageUrl?: string
      items: {
        productId?: string
        name: string
        detectedPrice: string
        correctPrice?: string
        confidence?: number
      }[]
    }) =>
      request<ApiReport>('/reports', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    removeItem: (reportId: string, itemId: string) =>
      request<{ success: boolean }>(`/reports/${reportId}/items/${itemId}`, {
        method: 'DELETE',
      }),

    submit: (id: string) =>
      request<ApiReport>(`/reports/${id}/submit`, { method: 'PUT' }),
  },
}
