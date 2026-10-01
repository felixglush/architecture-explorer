import { copyFileSync } from "node:fs";
// One self-contained build; the composition root selects the example by filename.
copyFileSync(
  new URL("../dist/index.html", import.meta.url),
  new URL("../dist/webhook.html", import.meta.url),
);
