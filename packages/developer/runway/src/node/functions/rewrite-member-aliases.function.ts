/**
 * Stackra file contract:
 * Purpose: `rewriteMemberAliases(text, file, root, imports)`, the `#` import rewrite one
 *          Encore app of several service members needs: Encore resolves neither package.json `imports` nor a per-member
 *          tsconfig, and two members' aliases collide (`#src/*` in each), so every static, re-exported, side-effect or
 *          dynamic import of a `#` alias becomes a relative path through the member's own `imports` map. Shared by the
 *          deploy tree (`encoreDeployTree`) and the local monolith app (`syncDevEncoreApp`).
 * Boundary: internal to `./node`, not re-exported. Checks which alias targets exist under the member root and returns the new text with the specifiers no
 *           target was found for; it writes nothing.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2 and its 2026-11-09 amendment), ADR 0233 (package.json imports), STA-2155,
 *                     STA-2840.
 */
import { existsSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

/** A static, re-exported, side-effect or dynamic import of a `#` alias: lead, quote, specifier. */
const ALIAS_IMPORT = /(from\s+|import\s*\(\s*|import\s+)(["'])(#[^"']+)\2/g;

/** The file a `#` specifier names through `imports`, the member's package.json map, or `undefined`. */
function aliasTarget(
  root: string,
  imports: Readonly<Record<string, unknown>>,
  spec: string,
): string | undefined {
  for (const [key, value] of Object.entries(imports)) {
    const prefix = key.endsWith("*") ? key.slice(0, -1) : undefined;
    if (prefix === undefined ? spec !== key : !spec.startsWith(prefix)) continue;
    const rest = prefix === undefined ? "" : spec.slice(prefix.length);
    for (const target of Array.isArray(value) ? value : [value]) {
      if (typeof target !== "string") continue;
      const path = join(root, target.replace("*", rest));
      if (existsSync(path) && statSync(path).isFile()) return path;
    }
  }
  return undefined;
}

/**
 * `text` with each `#` import rewritten to a path relative to `file`, through `imports` resolved under `root`.
 *
 * @param text - the TypeScript source.
 * @param file - where the source lives, under `root` (the relative paths are computed from its folder).
 * @param root - the member root the `imports` targets resolve from.
 * @param imports - the member's package.json `imports` (`memberImports`).
 * @returns the rewritten text and each specifier no target was found for (left as it was).
 * @example
 * rewriteMemberAliases('import { a } from "#src/a";', "/m/src/b.ts", "/m", { "#src/*": "./src/*.ts" });
 * // { text: 'import { a } from "./a";', unresolved: [] }
 */
export function rewriteMemberAliases(
  text: string,
  file: string,
  root: string,
  imports: Readonly<Record<string, unknown>>,
): { readonly text: string; readonly unresolved: readonly string[] } {
  const unresolved: string[] = [];
  const next = text.replace(ALIAS_IMPORT, (all, lead: string, quote: string, spec: string) => {
    const target = aliasTarget(root, imports, spec);
    if (target === undefined) {
      unresolved.push(spec);
      return all;
    }
    let rel = relative(dirname(file), target)
      .replace(/\.tsx?$/, "")
      .replace(/\/index$/, "");
    if (!rel.startsWith(".")) rel = `./${rel}`;
    return `${lead}${quote}${rel}${quote}`;
  });
  return { text: next, unresolved };
}
