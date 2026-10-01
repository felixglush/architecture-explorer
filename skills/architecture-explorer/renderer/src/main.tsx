import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui.css";
import App from "./App";
import { project } from "./project";
document.title = `${project.document.title} · Architecture explorer`;
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App
      project={project}
      initialRunId={
        new URLSearchParams(location.search).get("run") ?? undefined
      }
    />
  </StrictMode>,
);
