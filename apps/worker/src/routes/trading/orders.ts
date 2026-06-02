import { getWriteDb } from '../../services/supabase'
import type { TradingEnv } from '../../services/types'

export async function listOrderAttempts(env: TradingEnv, orderIntentId?: string) {
  const filters = orderIntentId ? { order_intent_id: `eq.${orderIntentId}` } : undefined
  const items = await getWriteDb(env).select('order_attempts', {
    select: '*',
    filters,
    order: 'created_at.desc',
    limit: 100
  })
  return { items }
}
