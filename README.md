# Panwoo Security Lab

A personal Next.js + MDX security dashboard for security news, notes, and writeups.

## Structure

- `app/`: Next.js App Router pages and API routes
- `components/`: dashboard UI components
- `content/notes/`: MDX/Markdown notes migrated from the old blog
- `public/files/`: downloadable files such as PDFs
- `public/images/`: static images
- `proxy/dreamhack-proxy.mjs`: Replit/Node reverse proxy for the DreamHack target

## Local development

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:3000`.

Production build:

```bash
npm run build
npm run start
```

## DreamHack Replit proxy

Run the full reverse proxy on Replit or another Node runtime:

```bash
npm run proxy:dreamhack
```

The server listens on `process.env.PORT || 5000` and proxies `/` to the configured DreamHack target. `/health` is handled before the proxy middleware.

Default target:

```text
http://host8.dreamhack.games:23403
```

Change the target with environment variables:

```bash
DH_PROTOCOL=http DH_HOST=host8.dreamhack.games DH_PORT=23403 npm run proxy:dreamhack
```

Put the Replit HTTPS URL into the dashboard launcher. The dashboard only stores and opens the Replit URL; it does not fetch the DreamHack host directly.
