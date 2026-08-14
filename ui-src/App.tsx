import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { parseHackMDUrl } from "../widget-src/api/hackmdUrl";

const post = (pluginMessage: Record<string, unknown>) => {
  window.parent?.postMessage({ pluginMessage }, "*");
};

function App() {
  // The widget tells us which panel to show.
  const [view, setView] = useState<"url" | "markdown">("url");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [markdown, setMarkdown] = useState("");
  // Editing pre-filled markdown vs. pasting fresh — changes the button label.
  const [editing, setEditing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (msg?.type !== "init") return;
      setView(msg.view === "markdown" ? "markdown" : "url");
      if (typeof msg.value === "string" && msg.value) {
        setMarkdown(msg.value);
        setEditing(true);
      }
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
      post({ type: "url", value: url });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  };

  const handleRenderMarkdown = () => {
    if (!markdown.trim()) {
      setError("Paste some Markdown to render.");
      return;
    }
    setError("");
    post({ type: "markdown", value: markdown });
  };

  if (view === "markdown") {
    return (
      <div className="App" ref={rootRef}>
        <div className="field">
          <label className="label">Paste Markdown</label>
          <textarea
            className="input textarea"
            placeholder="# Title&#10;Paste Markdown to render it directly…"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button onClick={handleRenderMarkdown}>
          {editing ? "Save changes" : "Render Markdown"}
        </button>
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
        Public notes and notes shared with "Anyone with the link" load right
        away.
      </p>
      {error && <p className="error">{error}</p>}
      <button onClick={handleSubmit}>Load note</button>
    </div>
  );
}

export default App;
