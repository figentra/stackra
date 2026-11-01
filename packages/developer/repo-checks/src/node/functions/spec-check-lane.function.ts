/**
 * Stackra file contract:
 * Purpose: `specCheckLane(context)`, the lane rule: `feat` commits need a lite or full spec reached through the
 *          branch key or their `Refs:` keys.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { SPECS_DIR } from "../constants/spec-dir.constant.ts";
import { specKeyPattern } from "./spec-key-pattern.function.ts";

/**
 * Problems of the PR's feat commits; empty when there are none or a key reaches a spec.
 *
 * @param context - the commit messages, the branch, the issue keys of the spec folders and of tasks.md tags (`OS-12`),
 *                  and the prefixes the repository uses.
 * @example
 * specCheckLane({ commits: ["feat: x"], branch: "main", prefixes: ["os"] });
 */
export function specCheckLane(context: {
  commits?: readonly string[];
  branch?: string;
  specKeys?: ReadonlySet<string>;
  taskKeys?: ReadonlySet<string>;
  prefixes?: readonly string[];
}): string[] {
  const {
    commits = [],
    branch = "",
    specKeys = new Set<string>(),
    taskKeys = new Set<string>(),
    prefixes = [],
  } = context;
  const feats = commits.filter((c) => /^feat(\(|!|:)/.test(c));
  if (!feats.length) return [];
  const re = new RegExp(`\\b(${specKeyPattern(prefixes)})-(\\d+)\\b`, "gi");
  const keys = new Set(
    [branch, ...feats].flatMap((t) =>
      [...t.matchAll(re)].map((m) => `${(m[1] ?? "").toUpperCase()}-${m[2] ?? ""}`),
    ),
  );
  if ([...keys].some((k) => specKeys.has(k) || taskKeys.has(k))) return [];
  return [
    `lane: ${feats.length} feat commit(s), but neither the branch nor their Refs keys (${[...keys].join(", ") || "none"}) reach a spec in ${SPECS_DIR} — new behaviour takes the lite or full lane; use chore/fix/docs for the others`,
  ];
}
