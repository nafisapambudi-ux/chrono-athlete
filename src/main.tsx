import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <div className="dark min-h-screen bg-background text-foreground">
    <App />
  </div>
);
