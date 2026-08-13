import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { parseHackMDUrl } from "../widget-src/api/hackmdUrl";

const post = (pluginMessage: Record<string, unknown>) => {
  window.parent?.postMessage({ pluginMessage }, "*");
};

function App() {
  // The widget tells us which panel to show and whether a token is already
  // stored. It never sends the token itself back to the iframe.
  const [view, setView] = useState<"url" | "token">("url");
  const [hasToken, setHasToken] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (msg?.type !== "init") return;
      setView(msg.view === "token" ? "token" : "url");
      setHasToken(Boolean(msg.hasToken));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Resize the iframe to fit its content so there's no dead space below.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const report = () =>
      post({
        type: "resize",
        height: Math.ceil(el.getBoundingClientRect().height),
      });
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = () => {
    try {
      parseHackMDUrl(url);
      setError("");
      // One message: the widget must store the token before it reads it back to
      // fetch, so URL and token can't be two racing messages.
      post({ type: "url", value: url, token: token.trim() || undefined });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  };

  if (view === "token") {
    return (
      <div className="App" ref={rootRef}>
        <div className="field">
          <label className="label">HackMD API token</label>
          <input
            className="input"
            type="password"
            placeholder={
              hasToken ? "Enter a new token to replace it" : "Paste your token"
            }
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <p className="hint">
          Create one in HackMD under Settings → API. Stored on this device only
          — never saved to the Figma file or shared with collaborators.
        </p>
        <div className="actions">
          <button onClick={() => post({ type: "token", value: token.trim() })}>
            Save token
          </button>
          {hasToken && (
            <button
              className="secondary"
              onClick={() => post({ type: "clear-token" })}
            >
              Remove token
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="App" ref={rootRef}>
      <div className="field">
        <label className="label">HackMD note URL</label>
        <input
          className="input"
          type="text"
          placeholder="https://hackmd.io/xxxxxxxx"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <p className="hint">
        {hasToken
          ? "API token saved. Manage it from the gear icon in the toolbar."
          : "Public notes load right away. For private notes, add a token from the gear icon in the toolbar."}
      </p>
      {error && <p className="error">{error}</p>}
      <button onClick={handleSubmit}>Load note</button>
    </div>
  );
}

export default App;
