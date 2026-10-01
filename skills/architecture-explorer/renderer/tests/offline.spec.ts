import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
test("built example is self-contained and navigable with networking disabled", async ({
  page,
  context,
}) => {
  await context.setOffline(true);
  await page.setContent(readFileSync("dist/index.html", "utf8"), {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator(".brand")).toContainText("JOB QUEUE");
  await page.getByRole("button", { name: "Walk through a job" }).click();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.getByTestId("metric-completed")).toHaveText("1");
});
