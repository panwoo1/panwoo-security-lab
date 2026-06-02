import { getWriteDb } from '../../services/supabase'
import type { TradingEnv } from '../../services/types'

export async function listOrderIntents(env: TradingEnv) {
  const items = await getWriteDb(env).select('order_intents', {
    select: '*',
    order: 'created_at.desc',
    limit: 100
  })
  return { items }
}

export async function approveOrderIntent(env: TradingEnv, id: string, actor = 'admin') {
  const db = getWriteDb(env)
  const [intent] = await db.update('order_intents', { status: 'APPROVED' }, { id: `eq.${id}` })
  await db.insert('order_approvals', [
    {
      order_intent_id: id,
      status: 'APPROVED',
      approved_by: actor,
      reason: 'Manual admin approval'
    }
  ], false)
  await db.insert('trading_audit_logs', [
    {
      event_type: 'order_intent_approval',
      order_intent_id: id,
      decision: 'ALLOW',
      reason: 'Order intent manually approved.',
      details: { actor }
    }
  ], false)
  return { item: intent }
}

export async function rejectOrderIntent(env: TradingEnv, id: string, actor = 'admin') {
  const db = getWriteDb(env)
  const [intent] = await db.update('order_intents', { status: 'REJECTED' }, { id: `eq.${id}` })
  await db.insert('order_approvals', [
    {
      order_intent_id: id,
      status: 'REJECTED',
      approved_by: actor,
      reason: 'Manual admin rejection'
    }
  ], false)
  await db.insert('trading_audit_logs', [
    {
      event_type: 'order_intent_rejection',
      order_intent_id: id,
      decision: 'BLOCK',
      reason: 'Order intent manually rejected.',
      details: { actor }
    }
  ], false)
  return { item: intent }
}
