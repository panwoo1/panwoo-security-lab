import type { TradingEnv } from '../types'

export function isKillSwitchEnabled(env: TradingEnv, persistedEnabled = false): boolean {
  return env.KILL_SWITCH === 'true' || persistedEnabled
}
