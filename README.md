# Panwoo Security Lab

A personal Next.js + MDX security dashboard for CTF workflow, security news, proxy access, and writeups.

## Structure

- `app/`: Next.js App Router pages and API routes
- `components/`: dashboard UI components
- `content/notes/`: MDX/Markdown notes migrated from the old blog
- `public/files/`: downloadable files such as PDFs
- `public/images/`: static images
- `proxy/dreamhack-proxy.mjs`: local/hosted DreamHack reverse proxy

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

## DreamHack proxy

GitHub Pages is static hosting, so it cannot run the Node proxy process or the Next.js API routes. Deploy the dashboard to a Node runtime such as Vercel, Replit, Render, Fly.io, or a small VPS. Run the proxy locally or deploy it separately to a Node runtime.

Local run:

```bash
npm run proxy:dreamhack
```

Open:

```text
http://127.0.0.1:5000
```

Override the DreamHack target when the challenge port changes:

```bash
DH_HOST=host3.dreamhack.games DH_PORT=13784 npm run proxy:dreamhack
```

For a hosted setup, deploy this repo as a Node app and use:

```bash
npm run proxy:dreamhack
```

Then paste the hosted URL into the dashboard's hosted proxy field.
