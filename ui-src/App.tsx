import React, { useEffect, useState } from "react";
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

  const handleSubmit = () => {
    try {
      parseHackMDUrl(url);
      setError("");
      // One message: the widget must store the token before it reads it back to
      // fetch, so URL and token can't be two racing messages.
      post({ type: "url", value: url, token: token.trim() || undefined });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    }
  };

  if (view === "token") {
    return (
      <div className="App">
        <p>HackMD API token</p>
        <input
          className="input"
          type="password"
          placeholder={hasToken ? "已設定，輸入以覆蓋" : "API token..."}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <p className="hint">
          在 HackMD 的 Settings → API 建立 token。Token 只會存在你自己的電腦上，
          不會寫進 Figma 檔案，也不會分享給協作者。
        </p>
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
    );
  }

  return (
    <div className="App">
      <p>HackMD URL:</p>
      <input
        className="input"
        type="text"
        placeholder="HackMD URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <p>API token（私人筆記才需要）:</p>
      <input
        className="input"
        type="password"
        placeholder={hasToken ? "已設定，可留空" : "選填"}
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
      <button onClick={handleSubmit}>Get started</button>
    </div>
  );
}

export default App;
