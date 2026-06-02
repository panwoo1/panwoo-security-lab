export type IdempotencyRecord = {
  key: string
  scope: string
  status: 'RESERVED' | 'EXECUTED' | 'FAILED' | 'EXPIRED'
  orderIntentId?: string
}

export function makeOrderIdempotencyKey(input: { signalId?: string; orderIntentId?: string; market: string; side: string }): string {
  const source = input.orderIntentId ? `intent:${input.orderIntentId}` : `signal:${input.signalId ?? 'manual'}`
  return `${source}:${input.market.toUpperCase()}:${input.side.toUpperCase()}`
}

export function canReserveIdempotencyKey(existing: IdempotencyRecord | undefined, key: string): { allowed: boolean; reason: string } {
  if (!existing) return { allowed: true, reason: 'Idempotency key is new.' }
  if (existing.key !== key) return { allowed: false, reason: 'Idempotency key mismatch.' }
  if (existing.status === 'EXECUTED') return { allowed: false, reason: 'Idempotency key already executed.' }
  if (existing.status === 'RESERVED') return { allowed: false, reason: 'Idempotency key is already reserved.' }
  if (existing.status === 'FAILED') return { allowed: false, reason: 'Failed idempotency key requires manual review before retry.' }
  return { allowed: true, reason: 'Expired idempotency key can be reserved again.' }
}
