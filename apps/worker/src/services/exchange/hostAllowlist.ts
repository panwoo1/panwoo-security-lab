const DEFAULT_ALLOWLIST: Record<string, string[]> = {
  upbit: ['api.upbit.com', 'api-manager.upbit.com'],
  mock: ['mock.exchange.local']
}

export function getAllowedHosts(provider: string, configuredHosts?: string): string[] {
  const fromEnv = configuredHosts
    ?.split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)

  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_ALLOWLIST[provider] ?? []
}

export function assertProviderHostAllowed(provider: string, targetUrl: string, configuredHosts?: string): URL {
  const url = new URL(targetUrl)
  const allowed = getAllowedHosts(provider, configuredHosts)

  if (url.protocol !== 'https:') {
    throw new Error('Signed exchange requests require HTTPS')
  }

  if (!allowed.includes(url.hostname.toLowerCase())) {
    throw new Error(`Provider host is not allowlisted: ${url.hostname}`)
  }

  return url
}
