import { getWriteDb } from '../../services/supabase'
import type { TradingEnv } from '../../services/types'

export async function setKillSwitch(env: TradingEnv, enabled: boolean, actor = 'admin') {
  const db = getWriteDb(env)
  const [state] = await db.upsert('kill_switch_state', [
    {
      scope: 'global',
      enabled,
      reason: enabled ? 'Manual kill switch enabled' : 'Manual kill switch disabled',
      changed_by: actor,
      updated_at: new Date().toISOString()
    }
  ], 'scope')
  await db.insert('trading_audit_logs', [
    {
      event_type: 'kill_switch',
      decision: enabled ? 'BLOCK' : 'ALLOW',
      reason: enabled ? 'Kill switch enabled by admin.' : 'Kill switch disabled by admin.',
      details: { actor, enabled }
    }
  ], false)
  return { state }
}
