import type { Balance, CancelResult, ExchangeClient, OrderRequest, OrderResult, Ticker } from './types.ts'

export class MockExchangeClient implements ExchangeClient {
  readonly orders: OrderRequest[] = []
  readonly cancelled: string[] = []

  async getBalances(): Promise<Balance[]> {
    return [
      { currency: 'KRW', available: 1_000_000, locked: 0 },
      { currency: 'BTC', available: 0.01, locked: 0 }
    ]
  }

  async getTicker(market: string): Promise<Ticker> {
    return {
      market,
      price: market === 'KRW-BTC' ? 50_000_000 : 1_000_000,
      timestamp: new Date().toISOString()
    }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResult> {
    this.orders.push(order)
    const price = order.limitPrice ?? (order.market === 'KRW-BTC' ? 50_000_000 : 1_000_000)
    const filledQuantity = order.quantity ?? (order.notionalKrw ? order.notionalKrw / price : 0)
    return {
      orderId: `mock-${order.clientOrderId}`,
      market: order.market,
      side: order.side,
      status: 'filled',
      filledQuantity,
      averagePrice: price,
      raw: { mock: true }
    }
  }

  async cancelOrder(orderId: string): Promise<CancelResult> {
    this.cancelled.push(orderId)
    return { orderId, status: 'cancelled', raw: { mock: true } }
  }
}
