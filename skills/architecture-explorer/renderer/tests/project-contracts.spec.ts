import { test, expect } from "@playwright/test";
import { validateProject, validateRun } from "../src/core/validate";
import type { ArchitectureProject, ReplayRun } from "../src/core/types";
function project(): ArchitectureProject {
  return {
    document: {
      schemaVersion: 1,
      id: "minimal",
      title: "Minimal",
      version: "1",
      description: "",
      components: [
        {
          id: "a",
          service: "s",
          title: "A",
          icon: "unknown",
          summary: "",
          responsibilities: [],
          sources: [],
          state: "",
          stateTypes: [],
        },
      ],
      services: [{ id: "s", title: "S", subtitle: "", color: "#000" }],
      connections: [],
      views: [{ id: "all", title: "All", description: "", nodes: ["a"] }],
      contracts: {},
      sources: {},
      messageKinds: {},
      modes: [{ id: "default", title: "Default" }],
      defaults: { view: "all", allView: "all", mode: "default" },
    },
  };
}
const run = (): ReplayRun => ({
  id: "r",
  title: "R",
  description: "",
  provenance: "",
  badge: "",
  data: null,
  events: [
    {
      sequence: 0,
      tick: 0,
      type: "sample",
      payload: null,
      raw: null,
      keyEvent: true,
      decision: null,
      trace: {
        title: "Sample",
        body: "",
        nodes: ["a"],
        edges: [],
        private: false,
      },
    },
  ],
});
test("project contracts reject unresolved references and invalid replay defaults", () => {
  expect(() => validateProject(project())).not.toThrow();
  const invalid = project();
  invalid.document.components[0].sources = [
    { path: "missing.ts", symbol: "Missing" },
  ];
  expect(() => validateProject(invalid)).toThrow("missing source");
  const badView = project();
  badView.document.views[0].nodes.push("missing");
  expect(() => validateProject(badView)).toThrow("unknown view component");
  const badVersion = project();
  Object.assign(badVersion.document, { schemaVersion: 2 });
  expect(() => validateProject(badVersion)).toThrow(
    "unsupported schema version",
  );
});
test("normalized replay rejects empty runs and unknown highlights", () => {
  expect(() => validateRun(project(), run())).not.toThrow();
  expect(() => validateRun(project(), { ...run(), events: [] })).toThrow(
    "at least one event",
  );
  const invalid = run();
  invalid.events[0].trace.nodes = ["missing"];
  expect(() => validateRun(project(), invalid)).toThrow("unknown component");
});

test("connections can describe calls without inventing message schemas", () => {
  const p = project();
  p.document.messageKinds.call = { label: "Calls", color: "#000" };
  p.document.connections.push({
    id: "call",
    source: "a",
    target: "a",
    label: "Calls",
    kind: "call",
    description: "Recursive call",
    when: "On invocation",
    failure: "Propagates",
  });
  expect(() => validateProject(p)).not.toThrow();
  p.document.connections[0].contract = "toString";
  expect(() => validateProject(p)).toThrow("missing contract");
});

import {
  projectDetail,
  availableDetailLevels,
  componentBoundary,
} from "../src/core/detail";
test("detail projection keeps edge identity, hides internal edges and exposes owner I/O", () => {
  const p = project(),
    d = p.document;
  d.components.push(
    { ...d.components[0], id: "b", detail: "implementation", parent: "a" },
    { ...d.components[0], id: "external" },
  );
  d.messageKinds.call = { label: "Call", color: "#000" };
  const edge = {
    id: "entry",
    source: "external",
    target: "b",
    kind: "call",
    label: "Call",
    description: "",
    when: "",
    failure: "",
  };
  d.connections = [
    edge,
    { ...edge, id: "internal", source: "a" },
    { ...edge, id: "self", source: "b" },
  ];
  expect(availableDetailLevels(d)).toEqual(["overview", "implementation"]);
  const overview = projectDetail(
    d,
    "overview",
    ["b", "external"],
    "default",
    true,
  );
  expect(overview.components.map((c) => c.id)).toEqual(["a", "external"]);
  expect(overview.messages.map((e) => [e.id, e.source, e.target])).toEqual([
    ["entry", "external", "a"],
    ["self", "a", "a"],
  ]);
  expect(componentBoundary(d, "a").inputs.map((e) => e.id)).toEqual([
    "entry",
    "self",
  ]);
  expect(
    projectDetail(d, "implementation", ["b"], "default", true).components.map(
      (c) => c.id,
    ),
  ).toEqual(["a", "b"]);
  d.components[1].parent = "missing";
  expect(() => validateProject(p)).toThrow("unknown parent");
  d.components[1].parent = "b";
  expect(() => validateProject(p)).toThrow("coarser");
  d.components[1].parent = "a";
  d.components[1].detail = "code";
  expect(() => validateProject(p)).toThrow("requires parent and source");
});
