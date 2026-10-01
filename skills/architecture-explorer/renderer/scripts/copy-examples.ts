import { copyFileSync } from "node:fs";
for (const name of ["webhook", "llm-rate-limiter", "url-shortener"])
  copyFileSync(
    new URL("../dist/index.html", import.meta.url),
    new URL(`../dist/${name}.html`, import.meta.url),
  );
