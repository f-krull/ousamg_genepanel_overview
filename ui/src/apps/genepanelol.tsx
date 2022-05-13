import React = require("react");
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("app");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<span>available soon</span>);
}
