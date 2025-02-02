import React, { useEffect } from "react";
import "./App.css";

function App() {
  useEffect(() => {
    if (typeof parent !== undefined) {
      parent?.postMessage?.({ pluginMessage: "hello" }, "*");
    }
  }, []);
  return (
    <div className="App">
      <h1>Test</h1>
    </div>
  );
}

export default App;
