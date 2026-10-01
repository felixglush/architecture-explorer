// Replace this composition root with your repository's adapter.
import { exampleProject, staticExampleProject } from "./projects/example";
import { httpExampleProject } from "./projects/http-example";
const selected = new URLSearchParams(location.search).get("project");
export const project =
  selected === "http-example"
    ? httpExampleProject
    : selected === "static-example"
      ? staticExampleProject
      : exampleProject;
