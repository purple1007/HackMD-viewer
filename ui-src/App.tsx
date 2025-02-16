import React, { useState } from "react";
import "./App.css";
import { getHackMDId } from "../widget-src/utils/hackMDId";

function App() {
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = () => {
    try {
      const noteId = getHackMDId(url);
      setError("");

      if (window.parent) {
        window.parent.postMessage(
          {
            pluginMessage: {
              type: "url",
              value: url,
              noteId: noteId,
            },
          },
          "*"
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("發生未知錯誤");
      }
    }
  };

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
      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
      <button className="button" onClick={handleSubmit}>
        Get started
      </button>
    </div>
  );
}

export default App;
