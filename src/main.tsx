import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { db } from "./lib/db";

// Initialize IndexedDB
db.open().catch((err) => {
  console.error("Failed to open IndexedDB:", err);
});

createRoot(document.getElementById("root")!).render(<App />);
