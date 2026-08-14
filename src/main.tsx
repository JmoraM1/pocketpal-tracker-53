import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initVisualViewport } from "./lib/viewport";

initVisualViewport();

createRoot(document.getElementById("root")!).render(<App />);
