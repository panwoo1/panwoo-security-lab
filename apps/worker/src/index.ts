export interface Env {
  KV: KVNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/health') {
      return Response.json({ ok: true, service: 'worker' })
    }

    if (pathname === '/api/message') {
      const message = (await env.KV.get('message')) ?? 'Hello from Cloudflare Worker'
      return Response.json({ message })
    }

    return new Response('Not Found', { status: 404 })
  }
}
