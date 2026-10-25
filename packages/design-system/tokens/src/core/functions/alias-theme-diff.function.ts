/**
 * Stackra file contract:
 * Purpose: a stored diff rewritten to the current token set (ADR 0340 decision 6): every leaf whose path an alias
 *          covers (the alias's path itself, or a path under it) moves to the alias's target, through as many renames as
 *          the map chains. A leaf already at a current path wins over one an alias moves onto it. `resolveTheme` and
 *          `parseThemeJson` run every diff through it before they check or merge.
 * Boundary: pure; the diff may come from storage or a pasted file, so only plain objects are followed and
 *           `__proto__`, `constructor` and `prototype` keys are dropped. With no alias to apply it returns the diff
 *           itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 6).
 */
import type { ThemeDiff } from "#contracts/types/theme-diff.type";
import { TOKEN_PATH_ALIASES } from "#core/constants/token-path-aliases.constant";

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Every leaf of `value` with its path, unsafe keys left out. */
function leavesOf(value: unknown, path: readonly string[] = []): [string, unknown][] {
  if (!isRecord(value)) return path.length === 0 ? [] : [[path.join("."), value]];
  return Object.entries(value)
    .filter(([key]) => !UNSAFE_KEYS.has(key))
    .flatMap(([key, child]) => leavesOf(child, [...path, key]));
}

/** `path` through the alias map, the longest covering alias first, until none covers it; a cycle stops the walk. */
function currentPath(path: string, aliases: Readonly<Record<string, string>>): string {
  const from = Object.keys(aliases);
  let result = path;
  for (let step = 0; step <= from.length; step += 1) {
    const alias = from
      .filter((old) => result === old || result.startsWith(`${old}.`))
      .sort((one, two) => two.length - one.length)[0];
    const target = alias === undefined ? undefined : aliases[alias];
    if (alias === undefined || target === undefined) return result;
    result = `${target}${result.slice(alias.length)}`;
  }
  return result;
}

/**
 * `diff` with every aliased path moved to its current one.
 * @param diff - a changes-only diff, as stored or pasted
 * @param aliases - old path to current path; the token set's own map when left out
 * @returns the rewritten diff, or `diff` itself when no alias applies
 */
export function aliasThemeDiff(
  diff: ThemeDiff,
  aliases: Readonly<Record<string, string>> = TOKEN_PATH_ALIASES,
): ThemeDiff {
  const leaves = leavesOf(diff).map(
    ([path, value]) => [path, currentPath(path, aliases), value] as const,
  );
  if (leaves.every(([path, current]) => path === current)) return diff;
  const result: Record<string, unknown> = {};
  const put = (path: string, value: unknown) => {
    const keys = path.split(".");
    let node = result;
    for (const key of keys.slice(0, -1)) {
      if (!isRecord(node[key])) node[key] = {};
      node = node[key] as Record<string, unknown>;
    }
    node[keys.at(-1) ?? ""] = value;
  };
  // Moved leaves first, so a leaf written at its current path overrides one moved onto it.
  for (const [path, current, value] of leaves) if (path !== current) put(current, value);
  for (const [path, current, value] of leaves) if (path === current) put(current, value);
  return result as ThemeDiff;
}
