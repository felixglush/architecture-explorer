import type { ArchitectureDocument, Component, DetailLevel } from "./types";
export const detailRank = { overview: 0, implementation: 1, code: 2 } as const;
export const detailLevels: DetailLevel[] = [
  "overview",
  "implementation",
  "code",
];
export function availableDetailLevels(model: ArchitectureDocument) {
  return detailLevels.filter(
    (level) =>
      level === "overview" || model.components.some((c) => c.detail === level),
  );
}
/** Project leaf relationships onto visible owners without inventing new edges. */
export function projectDetail(
  model: ArchitectureDocument,
  level: DetailLevel,
  candidates: string[],
  mode: string,
  privateFlows: boolean,
) {
  const byId = new Map(model.components.map((c) => [c.id, c]));
  const representative = (id: string): string | undefined => {
    let c = byId.get(id);
    const seen = new Set<string>();
    while (c && !seen.has(c.id)) {
      seen.add(c.id);
      if (c.modes && !c.modes.includes(mode)) return undefined;
      if (detailRank[c.detail ?? "overview"] <= detailRank[level]) return c.id;
      c = c.parent ? byId.get(c.parent) : undefined;
    }
    return undefined;
  };
  const visible = new Set(
    candidates
      .map(representative)
      .filter((id): id is string => id !== undefined),
  );
  // Include owners as context when a focus contains only a leaf.
  for (const id of [...visible]) {
    let c = byId.get(id);
    while (c?.parent) {
      const parent = representative(c.parent);
      if (!parent) break;
      visible.add(parent);
      c = byId.get(parent);
    }
  }
  const components: Component[] = model.components.filter((c) =>
    visible.has(c.id),
  );
  const messages = model.connections.flatMap((edge) => {
    if (edge.modes && !edge.modes.includes(mode)) return [];
    if (!privateFlows && model.messageKinds[edge.kind].private) return [];
    const source = representative(edge.source),
      target = representative(edge.target);
    if (!source || !target || !visible.has(source) || !visible.has(target))
      return [];
    if (source === target && edge.source !== edge.target) return [];
    return [{ ...edge, source, target }];
  });
  return { components, messages, representative };
}

/** Inspect an owner's external interface, including connections to its descendants. */
export function componentBoundary(model: ArchitectureDocument, id?: string) {
  const members = new Set<string>(id ? [id] : []);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of model.components)
      if (c.parent && members.has(c.parent) && !members.has(c.id)) {
        members.add(c.id);
        changed = true;
      }
  }
  const inputs = model.connections.filter(
    (e) =>
      members.has(e.target) &&
      (!members.has(e.source) || e.source === e.target),
  );
  const outputs = model.connections.filter(
    (e) =>
      members.has(e.source) &&
      (!members.has(e.target) || e.source === e.target),
  );
  return { members, inputs, outputs };
}
