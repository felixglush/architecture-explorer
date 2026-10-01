import type { Source } from "../../core/types";
/** Index these small teaching fixtures; not a general-purpose language parser. */
export function fixtureSource(
  code: string,
  path: string,
  symbol: string,
  fields: Source["fields"] = [],
): Source {
  const lines = code.split("\n");
  const start = lines.findIndex(
    (line) =>
      line.startsWith(`export function ${symbol}(`) ||
      line.startsWith(`export interface ${symbol} `),
  );
  if (start < 0) throw new Error(`Missing fixture symbol ${symbol}`);
  let end = start,
    depth = 0,
    opened = false;
  do {
    const line = lines[end++];
    if (line.includes("{")) opened = true;
    depth +=
      (line.match(/\{/g)?.length ?? 0) - (line.match(/\}/g)?.length ?? 0);
  } while ((!opened || depth > 0) && end < lines.length);
  if (!opened || depth !== 0)
    throw new Error(`Incomplete fixture symbol ${symbol}`);
  return {
    path,
    symbol,
    startLine: start + 1,
    endLine: end,
    code: lines.slice(start, end).join("\n"),
    language: "typescript",
    fields,
  };
}
