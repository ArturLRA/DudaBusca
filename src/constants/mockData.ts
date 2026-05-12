import { Report, Product, User } from '../types'

export const MOCK_USER: User = {
  name: 'Duda Souza',
  initials: 'DS',
  matricula: '00284',
  role: 'Conferente',
  totalSent: 184,
  approvalRate: 97,
}

export const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    corredor: 'Corredor 5',
    prateleira: 'Prateleira 17',
    date: '12 mai',
    time: '09:42',
    itemCount: 7,
    status: 'sent',
  },
  {
    id: '2',
    corredor: 'Corredor 2',
    prateleira: 'Laticínios',
    date: '11 mai',
    time: '17:08',
    itemCount: 3,
    status: 'sent',
  },
  {
    id: '3',
    corredor: 'Corredor 8',
    prateleira: 'Higiene',
    date: '10 mai',
    time: '14:20',
    itemCount: 12,
    status: 'sent',
  },
  {
    id: '4',
    corredor: 'Corredor 1',
    prateleira: 'Hortifruti',
    date: '08 mai',
    time: '11:14',
    itemCount: 4,
    status: 'sent',
  },
]

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Arroz Soltinho Dona Maria 1kg',
    corredor: 'Corredor 5',
    prateleira: 'prateleira 17',
    detectedPrice: 29.90,
    correctPrice: 26.90,
  },
  {
    id: '2',
    name: 'Arroz Integral Camil 1kg',
    corredor: 'Corredor 5',
    prateleira: 'prateleira 17',
    detectedPrice: 24.50,
    correctPrice: 24.50,
  },
  {
    id: '3',
    name: 'Feijão Carioca Kicaldo 1kg',
    corredor: 'Corredor 5',
    prateleira: 'prateleira 18',
    detectedPrice: 9.90,
    correctPrice: 8.50,
  },
  {
    id: '4',
    name: 'Macarrão Espaguete Renata 500g',
    corredor: 'Corredor 5',
    prateleira: 'prateleira 19',
    detectedPrice: 4.99,
    correctPrice: 4.99,
  },
  {
    id: '5',
    name: 'Açúcar Refinado União 1kg',
    corredor: 'Corredor 5',
    prateleira: 'prateleira 17',
    detectedPrice: 5.49,
    correctPrice: 4.89,
  },
  {
    id: '6',
    name: 'Óleo de soja Liza 900ml',
    corredor: 'Corredor 5',
    prateleira: 'prateleira 20',
    detectedPrice: 8.99,
    correctPrice: 8.99,
  },
]
