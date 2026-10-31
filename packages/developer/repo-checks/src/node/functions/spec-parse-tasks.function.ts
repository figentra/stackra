/**
 * Stackra file contract:
 * Purpose: `specParseTasks(text, prefixes)`, the task lines of a tasks.md with their phase heading.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import type { SpecTask } from "../types/spec-task.type.ts";
import { specKeyPattern } from "./spec-key-pattern.function.ts";
import { specStrip } from "./spec-strip.function.ts";

const list = (s: string | undefined): string[] =>
  s === undefined ? [] : [...s.matchAll(/\b(?:FR|SC|EC|AC|P)-\d+\b|\bT\d{3}\b/g)].map((m) => m[0]);

/**
 * The tasks of a tasks.md.
 *
 * @param text - the tasks.md text.
 * @param prefixes - the issue prefixes the repository uses; a trailing `[KEY-n]` tag counts only for these.
 * @example
 * specParseTasks("- [ ] T001 a — covers: FR-001", ["sta"])[0]?.covers; // ["FR-001"]
 */
export function specParseTasks(text: string, prefixes: readonly string[] = []): SpecTask[] {
  const keys = specKeyPattern(prefixes, "upper");
  const field = (rest: string, name: string): string | undefined =>
    new RegExp(`\\b${name}:\\s*([^—\\[]*?)\\s*(?:—|\\[${keys}-|$)`).exec(rest)?.[1]?.trim();
  const tasks: SpecTask[] = [];
  let phase = "";
  for (const [i, line] of specStrip(text).split("\n").entries()) {
    const h = /^##\s+(.*)$/.exec(line);
    if (h) {
      phase = (h[1] ?? "").trim();
      continue;
    }
    const m = /^\s*[-*] \[([ xX])\] (~~)?(T\d{3})(~~)?(.*)$/.exec(line);
    if (!m) continue;
    const rest = m[5] ?? "";
    tasks.push({
      line: i + 1,
      id: m[3] ?? "",
      done: m[1] !== " ",
      struck: Boolean(m[2] || m[4]),
      parallel: /^\s*\[P\]/.test(rest),
      covers: list(field(rest, "covers")),
      route: field(rest, "route"),
      deps: list(field(rest, "deps")),
      paths: [...rest.matchAll(/`([^`]+)`/g)].map((p) => p[1] ?? ""),
      key: new RegExp(`\\[(${keys}-\\d+)\\]\\s*$`).exec(rest)?.[1],
      phase,
    });
  }
  return tasks;
}
