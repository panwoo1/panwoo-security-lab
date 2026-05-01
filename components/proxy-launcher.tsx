"use client";

import { useEffect, useState } from "react";

const localProxy = "http://127.0.0.1:5000";

function normalizeUrl(value: string) {
  try {
    return new URL(value).toString();
  } catch {
    return "";
  }
}

export function ProxyLauncher() {
  const [target, setTarget] = useState("");
  const [hostedProxy, setHostedProxy] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHostedProxy(localStorage.getItem("panwoo.hostedProxyUrl") || "");
  }, []);

  function openTarget() {
    const url = normalizeUrl(target || localProxy);
    if (url) window.open(url, "_blank", "noopener");
  }

  async function copyCurl() {
    const url = normalizeUrl(target || localProxy);
    if (!url) return;
    await navigator.clipboard.writeText(`curl -x http://127.0.0.1:8080 -k -i ${JSON.stringify(url)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function openHosted() {
    const url = normalizeUrl(hostedProxy);
    if (url) window.open(url, "_blank", "noopener");
  }

  function saveHosted() {
    const url = normalizeUrl(hostedProxy);
    if (!url) return;
    localStorage.setItem("panwoo.hostedProxyUrl", url);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <section className="panel proxy-panel">
      <div className="panel-heading">
        <div>
          <span className="panel-label">CTF Proxy</span>
          <h2>DreamHack Access</h2>
        </div>
        <span className="status-pill">local or hosted</span>
      </div>

      <div className="form-stack">
        <label>
          <span>Target or local proxy URL</span>
          <input
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder={localProxy}
            type="url"
          />
        </label>
        <div className="button-row">
          <button className="button primary" type="button" onClick={openTarget}>
            Open
          </button>
          <button className="button" type="button" onClick={copyCurl}>
            {copied ? "Copied" : "Copy curl"}
          </button>
        </div>
      </div>

      <div className="proxy-profile">
        <span>Local reverse proxy</span>
        <strong>{localProxy.replace("http://", "")}</strong>
      </div>

      <div className="form-stack hosted-form">
        <label>
          <span>Hosted proxy URL</span>
          <input
            value={hostedProxy}
            onChange={(event) => setHostedProxy(event.target.value)}
            placeholder="https://your-proxy.replit.app"
            type="url"
          />
        </label>
        <div className="button-row">
          <button className="button primary" type="button" onClick={openHosted}>
            Open hosted
          </button>
          <button className="button" type="button" onClick={saveHosted}>
            {saved ? "Saved" : "Save URL"}
          </button>
        </div>
      </div>

      <p className="panel-hint">
        Run <code>npm run proxy:dreamhack</code> locally, or deploy the proxy process to a Node
        runtime and save that URL here.
      </p>
    </section>
  );
}
