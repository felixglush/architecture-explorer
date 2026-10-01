// Replace this composition root with your repository's adapter.
import { exampleProject, staticExampleProject } from "./projects/example";
import { httpExampleProject } from "./projects/http-example";
import { webhookProject } from "./projects/webhook";
const selected =
  new URLSearchParams(location.search).get("project") ??
  (location.pathname.endsWith("/webhook.html") ? "webhook" : null);
export const project =
  selected === "webhook"
    ? webhookProject
    : selected === "http-example"
      ? httpExampleProject
      : selected === "static-example"
        ? staticExampleProject
        : exampleProject;
