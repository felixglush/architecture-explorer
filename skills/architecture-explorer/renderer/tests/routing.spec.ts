import { test, expect } from "@playwright/test";
import { layoutDiagram } from "../src/diagram/layout";
test("project IDs cannot collide with layout internals or other namespaces", async () => {
  const ids = [
    "diagram-root",
    "service:s",
    "__proto__",
    "boundary-s",
    "routing-extent",
  ];
  const links = ids
    .slice(1)
    .map((id, i) => ({ id, source: ids[i], target: id }));
  const layout = await layoutDiagram(
    [{ id: "s" }],
    ids.map((id) => ({ id, service: "s" })),
    links,
  );
  for (const id of ids) expect(Object.hasOwn(layout.positions, id)).toBe(true);
  for (const link of links)
    expect(layout.routes[link.id].points.length).toBeGreaterThan(1);
});
