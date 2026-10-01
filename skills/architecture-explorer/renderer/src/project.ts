// Replace this composition root with your repository's adapter.
import { exampleProject, staticExampleProject } from "./projects/example";
import { httpExampleProject } from "./projects/http-example";
import { webhookProject } from "./projects/webhook";
import { rateLimiterProject } from "./projects/llm-rate-limiter";
import { shortenerProject } from "./projects/url-shortener";
const selected =
  new URLSearchParams(location.search).get("project") ??
  location.pathname
    .split("/")
    .pop()
    ?.replace(/\.html$/, "");
export const project =
  selected === "llm-rate-limiter"
    ? rateLimiterProject
    : selected === "url-shortener"
      ? shortenerProject
      : selected === "webhook"
        ? webhookProject
        : selected === "http-example"
          ? httpExampleProject
          : selected === "static-example"
            ? staticExampleProject
            : exampleProject;
