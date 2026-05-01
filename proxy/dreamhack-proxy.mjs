import express from "express";
import { createServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

const CONFIG = {
  PUBLIC_PORT: Number(process.env.PUBLIC_PORT || 5000),
  DH: {
    HOST: process.env.DH_HOST || "host3.dreamhack.games",
    PORT: Number(process.env.DH_PORT || 13784),
    PROTOCOL: process.env.DH_PROTOCOL || "http",
  },
};

const TARGET = `${CONFIG.DH.PROTOCOL}://${CONFIG.DH.HOST}:${CONFIG.DH.PORT}`;

const app = express();

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
  console.log("=================================");
});
