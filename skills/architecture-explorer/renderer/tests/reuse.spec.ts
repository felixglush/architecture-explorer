import { test, expect } from "@playwright/test";

test("the same explorer renders a TypeScript job pipeline and its replay", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?project=example");
  await expect(page.locator(".brand")).toContainText("JOB QUEUE");
  await expect(
    page.locator('.react-flow__node[data-id="worker"]'),
  ).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="world"]')).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Browse components" }).click();
  await page
    .getByRole("button", { name: "Inspect Worker", exact: true })
    .click();
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await inspector.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(inspector.locator(".code-block")).toContainText(
    "function processJob",
  );
  await expect(
    inspector.locator('.code-block pre span[style*="color"]').first(),
  ).toBeVisible();
  await inspector.getByRole("tab", { name: "I/O", exact: true }).click();
  await inspector
    .getByRole("region", { name: "Inputs contracts" })
    .locator("summary")
    .click();
  await expect(
    inspector.getByRole("region", { name: "Inputs contracts" }),
  ).toContainText("text");
  await page.getByRole("button", { name: "Walk through a job" }).click();
  await expect(page.getByTestId("metric-completed")).toHaveText("0");
  await page
    .getByRole("button", { name: "Next decision", exact: true })
    .click();
  await expect(page.locator(".decision-spotlight")).toContainText(
    "Worker · Completed",
  );
  await expect(page.getByTestId("metric-completed")).toHaveText("1");
  await expect(inspector.locator(".state-table")).toContainText("completed");
  await inspector.getByRole("tab", { name: "I/O", exact: true }).click();
  const recorded = inspector.getByRole("region", {
    name: "Recorded input and output",
  });
  await recorded
    .locator("summary")
    .filter({ hasText: "Recorded output" })
    .click();
  await expect(recorded.locator("details[open] pre")).toContainText(
    '"characters": 5',
  );
  await expect(page.getByRole("button", { name: "Load JSONL" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Download this run" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("static projects work without recorded runs or a runtime adapter", async ({
  page,
}) => {
  await page.goto("/?project=static-example");
  await expect(
    page.getByRole("button", { name: "No recorded runs" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Browse components" }).click();
  await page
    .getByRole("button", { name: "Inspect Worker", exact: true })
    .click();
  await page.getByRole("tab", { name: "State", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Inspector" }),
  ).toContainText("No recorded state available");
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.locator(".code-block")).toContainText("processJob");
});

test("a Go HTTP example supports schema-less connections and event-only replay", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?project=http-example");
  await expect(page.locator(".react-flow__node-component")).toHaveCount(2);
  await page.getByRole("button", { name: "Browse components" }).click();
  await page
    .getByRole("button", { name: "Inspect Health handler", exact: true })
    .click();
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await inspector.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(inspector.locator(".code-block")).toContainText("func Health");
  await inspector.getByRole("tab", { name: "I/O", exact: true }).click();
  await inspector.locator("summary").filter({ hasText: "HTTP call" }).click();
  await expect(inspector).toContainText("No schema provided");
  await inspector.getByRole("button", { name: "Inspect connection" }).click();
  await inspector.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(inspector).toContainText("No source definition");
  await page.getByRole("button", { name: "Walk through a request" }).click();
  await expect(page.locator(".run-metrics")).toHaveCount(0);
  await expect(page.locator(".decision-navigation")).toHaveCount(0);
  await page.getByRole("button", { name: "Browse components" }).click();
  await page
    .getByRole("button", { name: "Inspect Health handler", exact: true })
    .click();
  await inspector.getByRole("tab", { name: "State", exact: true }).click();
  await expect(inspector).toContainText("Recorded state unavailable");
  await expect(inspector).toContainText("No recorded state available");
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.locator(".run-player")).toContainText("Response written");
  expect(errors).toEqual([]);
});

test("the standalone canvas retains the notebook layout and expandable replay", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".component-card")).toHaveCount(3);
  await expect
    .poll(async () =>
      page.locator(".component-card").evaluateAll((cards) =>
        cards.every((card) => {
          const r = card.getBoundingClientRect();
          return (
            r.left >= 0 &&
            r.top >= 0 &&
            r.right <= innerWidth &&
            r.bottom <= innerHeight
          );
        }),
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/standalone-overview.png",
    fullPage: true,
  });
  await expect(
    page.getByRole("complementary", { name: "Inspector" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Walk through a job" }).click();
  const compact = await page.locator(".run-player").boundingBox();
  await page.locator(".event-payload summary").click();
  const expanded = await page.locator(".run-player").boundingBox();
  expect(expanded!.height).toBeGreaterThan(compact!.height + 100);
  await expect(
    page.getByRole("button", { name: "Next step", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: "test-results/standalone-canvas.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Next step", exact: true }),
  ).toBeInViewport();
});
