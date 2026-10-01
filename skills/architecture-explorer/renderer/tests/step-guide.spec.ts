import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

for (const example of [
  { file: "webhook", run: "webhook-retry", steps: 7 },
  { file: "llm-rate-limiter", run: "llm-rate-limiter", steps: 7 },
  { file: "url-shortener", run: "url-shortener", steps: 4 },
])
  test(`${example.file}: offline step guide follows the shared replay and inspects flows`, async ({
    page,
    context,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.setOffline(true);
    const url = `https://example.test/project/${example.file}.html?run=${example.run}`;
    await page.route("**/*", (route) =>
      route.request().url() === url
        ? route.fulfill({
            contentType: "text/html",
            body: readFileSync(`dist/${example.file}.html`, "utf8"),
          })
        : route.abort(),
    );
    await page.goto(url);
    await page.getByRole("button", { name: "Step guide", exact: true }).click();
    const guide = page.getByRole("complementary", { name: "Step guide" });
    await expect(
      guide.getByRole("list", { name: "Flow steps" }).getByRole("button"),
    ).toHaveCount(example.steps);
    await expect(
      guide.getByRole("button", { name: "Back", exact: true }),
    ).toBeDisabled();
    await guide.getByRole("button", { name: "Next step", exact: true }).click();
    await expect(
      page.getByRole("slider", { name: "Run progress" }),
    ).toHaveValue("1");
    await page.getByLabel("Level of detail").selectOption("code");
    await expect(
      guide.locator('[aria-current="step"] .guide-number'),
    ).toHaveText("2");
    await expect(page.locator(".run-main")).toBeHidden();
    const flow = guide.getByRole("button", { name: /Inspect flow:/ }).first();
    await flow.click();
    await expect(
      page.getByRole("complementary", { name: "Inspector" }),
    ).toBeVisible();
    await expect(guide).toHaveCount(0);
    await page.getByRole("button", { name: "Back to step guide" }).click();
    await expect(
      guide.locator('[aria-current="step"] .guide-number'),
    ).toHaveText("2");
    await guide.locator(".guide-step").last().click();
    await expect(
      page.getByRole("slider", { name: "Run progress" }),
    ).toHaveValue(String(example.steps - 1));
    await expect(
      guide.getByRole("button", { name: "Next step", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Event journal", exact: true }),
    ).toHaveCount(0);
    await expect(guide.locator('[aria-current="step"]')).toBeInViewport();
    await guide.locator(".guide-payload summary").click();
    await expect(guide.locator(".guide-payload pre")).not.toBeEmpty();
    await page.screenshot({
      path: info.outputPath(`${example.file}-guide.png`),
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      guide.getByRole("button", { name: "Close step guide" }),
    ).toBeInViewport();
    await page.screenshot({
      path: info.outputPath(`${example.file}-mobile.png`),
    });
    await guide.getByRole("button", { name: "Close step guide" }).click();
    await expect(guide).toHaveCount(0);
    await expect(
      page.getByRole("slider", { name: "Run progress" }),
    ).toHaveValue(String(example.steps - 1));
    expect(errors).toEqual([]);
  });

test("guide exposes snapshots and keeps keyboard and transport navigation synchronized", async ({
  page,
}) => {
  await page.goto("/webhook.html?run=webhook-retry");
  await page.getByRole("button", { name: "Step guide", exact: true }).click();
  const guide = page.getByRole("complementary", { name: "Step guide" });
  await guide.locator(".guide-step").nth(4).click();
  await guide
    .locator(".guide-component details")
    .first()
    .locator("summary")
    .click();
  await expect(guide).toContainText("Before");
  await expect(guide).toContainText("After");
  await page.keyboard.press("ArrowRight");
  await expect(guide.locator('[aria-current="step"] .guide-number')).toHaveText(
    "6",
  );
  await page.getByRole("button", { name: "Restart run" }).click();
  await expect(guide.locator('[aria-current="step"] .guide-number')).toHaveText(
    "1",
  );
  await page.getByRole("button", { name: "Hide replay" }).click();
  await expect(guide).toHaveCount(0);
  await page.getByRole("button", { name: "Resume replay" }).click();
  await expect(guide).toBeVisible();
});

test("event-only adapters need no domain data or state to use the guide", async ({
  page,
}) => {
  await page.goto("/?project=http-example");
  await page.getByRole("button", { name: "Walk through a request" }).click();
  await page.getByRole("button", { name: "Step guide", exact: true }).click();
  const guide = page.getByRole("complementary", { name: "Step guide" });
  await expect(guide).toContainText("No state snapshot provided");
  await expect(
    guide.getByRole("button", { name: /Inspect flow:/ }),
  ).toHaveCount(1);
});
