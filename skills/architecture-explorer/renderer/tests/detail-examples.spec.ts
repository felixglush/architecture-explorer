import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  reserve,
  reconcile,
  refill,
} from "../src/projects/llm-rate-limiter/limiter";
import {
  base62,
  shorten,
  redirect,
} from "../src/projects/url-shortener/shortener";

test("LLM admission preserves both budgets on rejection and settles only once", () => {
  const p = { requests: 2, tokens: 100, requestRefill: 1, tokenRefill: 10 };
  const a = { requests: 2, tokens: 100, at: 0, reservations: {} };
  expect(reserve(a, p, "one", 80, 0).allowed).toBe(true);
  expect(reserve(a, p, "two", 40, 0)).toMatchObject({
    allowed: false,
    retryAfter: 2,
  });
  expect(a).toMatchObject({ requests: 1, tokens: 20 });
  expect(reconcile(a, p, "one", 50)).toBe(true);
  expect(reconcile(a, p, "one", 50)).toBe(false);
  expect(a.tokens).toBe(50);
  expect(reserve(a, p, "two", 40, 0).allowed).toBe(true);
  expect(reserve(a, p, "three", 5, 0)).toMatchObject({
    allowed: false,
    retryAfter: 1,
  });
  refill(a, p, 100);
  expect(a.requests).toBe(2);
  expect(a.tokens).toBe(100);
  expect(reserve(a, p, "huge", 101, 100).retryAfter).toBeNull();
  expect(reserve(a, p, "__proto__", 10, 100).allowed).toBe(true);
  expect(reconcile(a, p, "__proto__", 5)).toBe(true);
});
test("URL shortener creates unique codes and respects expiry on hits and misses", () => {
  const s = { nextId: 62, links: new Map(), cache: new Map(), reads: 0 };
  const code = shorten(s, "https://example.com/a", 10);
  expect(code).toBe("10");
  expect(shorten(s, "https://example.com/b", 20)).not.toBe(code);
  expect(base62(0)).toBe("0");
  expect(redirect(s, code, 0)).toBe("https://example.com/a");
  expect(s.reads).toBe(1);
  expect(redirect(s, code, 1)).toBe("https://example.com/a");
  expect(s.reads).toBe(1);
  expect(redirect(s, code, 10)).toBeNull();
  expect(s.cache.has(code)).toBe(false);
  expect(redirect(s, "missing", 11)).toBeNull();
});
for (const example of [
  { file: "webhook", run: "webhook-retry", counts: [3, 5, 8], steps: 7 },
  {
    file: "llm-rate-limiter",
    run: "llm-rate-limiter",
    counts: [3, 6, 9],
    steps: 7,
  },
  { file: "url-shortener", run: "url-shortener", counts: [2, 5, 8], steps: 4 },
])
  test(`${example.file}: all detail levels replay offline without resetting progress`, async ({
    page,
    context,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.setOffline(true);
    const url = `https://example.test/architecture-explorer/${example.file}.html?run=${example.run}`;
    const requests: string[] = [];
    await page.route("**/*", (route) => {
      requests.push(route.request().url());
      return route.request().url() === url
        ? route.fulfill({
            contentType: "text/html",
            body: readFileSync(`dist/${example.file}.html`, "utf8"),
          })
        : route.abort();
    });
    await page.goto(url);
    const control = page.getByLabel("Level of detail");
    for (let i = 0; i < 3; i++) {
      await control.selectOption(["overview", "implementation", "code"][i]);
      await expect(page.locator(".component-card")).toHaveCount(
        example.counts[i],
      );
      await page.getByRole("button", { name: "Restart run" }).click();
      for (let step = 1; step < example.steps; step++)
        await page
          .getByRole("button", { name: "Next step", exact: true })
          .click();
      await expect(
        page.getByRole("button", { name: "Next step", exact: true }),
      ).toBeDisabled();
      await page.screenshot({
        path: info.outputPath(`${example.file}-${i}.png`),
      });
    }
    await control.selectOption("overview");
    await expect(
      page.getByRole("button", { name: "Next step", exact: true }),
    ).toBeDisabled();
    expect(errors).toEqual([]);
    expect(requests).toHaveLength(1);
  });

test("selected code and replay cursor survive collapse while the owning component stays highlighted", async ({
  page,
}) => {
  await page.goto("/webhook.html?run=webhook-retry");
  await page.getByLabel("Level of detail").selectOption("code");
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await page.getByRole("button", { name: "Browse components" }).click();
  await page
    .getByRole("button", { name: "Inspect claimEvent", exact: true })
    .click();
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await inspector.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(inspector.locator(".code-block")).toContainText(
    "processed.has(id)",
  );
  await page.getByLabel("Level of detail").selectOption("overview");
  await expect(inspector.locator(".code-block")).toContainText(
    "processed.has(id)",
  );
  await expect(page.locator(".run-player")).toContainText(
    "First delivery attempt",
  );
  await expect(
    page.locator('[data-id="receiver"] .component-card'),
  ).toHaveClass(/is-active/);
  await expect(page.locator('[data-id="claim-code"]')).toHaveCount(0);
  await page.getByLabel("Level of detail").selectOption("code");
  await expect(
    page.locator('[data-id="claim-code"] .component-card'),
  ).toHaveClass(/is-active/);
});

for (const example of [
  {
    id: "llm-rate-limiter",
    component: "LLM admission",
    symbol: "reserve",
    field: "inFlight",
    output: "Reserved request and tokens",
  },
  {
    id: "url-shortener",
    component: "URL service",
    symbol: "shorten",
    field: "databaseReads",
    output: "shortCode",
  },
])
  test(`${example.id}: owner inspection exposes source, state and descendant I/O`, async ({
    page,
  }) => {
    await page.goto(`/${example.id}.html?run=${example.id}`);
    await page.getByRole("button", { name: "Browse components" }).click();
    await page
      .getByRole("button", {
        name: `Inspect ${example.component}`,
        exact: true,
      })
      .click();
    const inspector = page.getByRole("complementary", { name: "Inspector" });
    await inspector.getByRole("tab", { name: "Code", exact: true }).click();
    await expect(inspector.locator(".code-block").first()).toContainText(
      `export function ${example.symbol}`,
    );
    await inspector.getByRole("tab", { name: "State", exact: true }).click();
    await expect(inspector).toContainText(example.field);
    await inspector.getByRole("tab", { name: "I/O", exact: true }).click();
    const io = inspector.getByRole("region", {
      name: "Recorded input and output",
    });
    await io.locator("summary").filter({ hasText: "Recorded output" }).click();
    await expect(io).toContainText(example.output);
  });
