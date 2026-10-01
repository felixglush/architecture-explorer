import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("webhook example traces a failed attempt, retry and duplicate without processing twice", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/webhook.html?run=webhook-retry");
  await expect(page.locator(".brand")).toContainText("WEBHOOK DELIVERY");
  await expect(page.locator(".component-card")).toHaveCount(5);
  await expect(page.locator(".run-player")).toContainText("Synthetic example");
  await expect(page.getByTestId("metric-processed")).toHaveText("0");
  const next = page.getByRole("button", { name: "Next step", exact: true });
  await next.click();
  await next.click();
  await expect(page.locator(".decision-spotlight")).toContainText(
    "Worker · Retry",
  );
  await expect(page.getByTestId("metric-attempts")).toHaveText("1");
  await expect(page.getByTestId("metric-processed")).toHaveText("0");
  await next.click();
  await next.click();
  await expect(page.getByTestId("metric-processed")).toHaveText("1");
  await next.click();
  await next.click();
  await expect(page.locator(".decision-spotlight")).toContainText(
    "Receiver · Duplicate",
  );
  await expect(page.getByTestId("metric-processed")).toHaveText("1");
  await expect(page.getByTestId("metric-duplicates")).toHaveText("1");
  await expect(page.getByTestId("metric-attempts")).toHaveText("3");
  await page.getByRole("button", { name: "Browse components" }).click();
  await page
    .getByRole("button", { name: "Inspect Webhook receiver", exact: true })
    .click();
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await inspector.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(inspector.locator(".code-block")).toContainText(
    "processed.has(event.id)",
  );
  await inspector.getByRole("tab", { name: "I/O", exact: true }).click();
  await inspector
    .getByRole("region", { name: "Inputs contracts" })
    .locator("summary")
    .click();
  await expect(inspector).toContainText("orderId");
  await inspector.getByRole("tab", { name: "State", exact: true }).click();
  await expect(inspector).toContainText("Synthetic in-memory state");
  await page.getByRole("button", { name: "Restart run" }).click();
  await expect(page.getByTestId("metric-processed")).toHaveText("0");
  await expect(page.getByTestId("metric-duplicates")).toHaveText("0");
  expect(errors).toEqual([]);
});

test("built webhook artifact runs offline under a Pages-style subpath", async ({
  page,
  context,
}) => {
  await context.setOffline(true);
  const requests: string[] = [];
  await page.route("**/*", (route) => {
    const url = route.request().url();
    requests.push(url);
    if (
      url ===
      "https://example.test/architecture-explorer/webhook.html?run=webhook-retry"
    )
      return route.fulfill({
        contentType: "text/html",
        body: readFileSync("dist/webhook.html", "utf8"),
      });
    return route.abort();
  });
  await page.goto(
    "https://example.test/architecture-explorer/webhook.html?run=webhook-retry",
  );
  await expect(page.locator(".brand")).toContainText("WEBHOOK DELIVERY");
  await expect(page.locator(".run-player")).toContainText(
    "An order event enters the queue",
  );
  await page
    .getByRole("button", { name: "Next decision", exact: true })
    .click();
  await expect(page.locator(".decision-spotlight")).toContainText(
    "Worker · Retry",
  );
  expect(requests).toHaveLength(1);
});
