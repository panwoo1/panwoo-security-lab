export type OrderSide = 'BUY' | 'SELL'
export type OrderType = 'market' | 'limit'

export type Balance = {
  currency: string
  available: number
  locked: number
}

export type Ticker = {
  market: string
  price: number
  timestamp: string
}

export type OrderRequest = {
  clientOrderId: string
  market: string
  side: OrderSide
  type: OrderType
  quantity?: number
  notionalKrw?: number
  limitPrice?: number
}

export type OrderResult = {
  orderId: string
  market: string
  side: OrderSide
  status: 'accepted' | 'filled' | 'rejected'
  filledQuantity?: number
  averagePrice?: number
  raw?: unknown
}

export type CancelResult = {
  orderId: string
  status: 'cancelled' | 'not_found'
  raw?: unknown
}

export interface ExchangeClient {
  getBalances(): Promise<Balance[]>
  getTicker(market: string): Promise<Ticker>
  placeOrder(order: OrderRequest): Promise<OrderResult>
  cancelOrder(orderId: string): Promise<CancelResult>
}
