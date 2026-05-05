import express from "express";
import { createServer } from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";

const CONFIG = {
  PUBLIC_PORT: Number(process.env.PORT || 5000),
  DH: {
    HOST: process.env.DH_HOST || "host8.dreamhack.games",
    PORT: Number(process.env.DH_PORT || 23403),
    PROTOCOL: process.env.DH_PROTOCOL || "http",
  },
};

const TARGET = `${CONFIG.DH.PROTOCOL}://${CONFIG.DH.HOST}:${CONFIG.DH.PORT}`;

const app = express();

app.get("/health", (_req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.json({
    ok: true,
    service: "dreamhack-replit-proxy",
    target: TARGET,
    host: CONFIG.DH.HOST,
    port: CONFIG.DH.PORT,
    protocol: CONFIG.DH.PROTOCOL,
  });
});

app.use(
  "/",
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    ws: true,
    cookieDomainRewrite: "",
    logLevel: "debug",
    on: {
      proxyReq(proxyReq, req) {
        console.log(`[REQ] ${req.method} ${req.url} -> ${TARGET}`);
      },
      proxyRes(proxyRes, req) {
        console.log(`[RES] ${req.method} ${req.url} ${proxyRes.statusCode}`);
      },
      error(err, req) {
        console.error(`[PROXY ERROR] ${req.url}`, err.message);
      },
    },
  }),
);

createServer(app).listen(CONFIG.PUBLIC_PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log("[+] DreamHack Proxy Running");
  console.log(`[+] Public Port : ${CONFIG.PUBLIC_PORT}`);
  console.log(`[+] Target      : ${TARGET}`);
  console.log(`[+] Health      : /health`);
  console.log("=================================");
});
