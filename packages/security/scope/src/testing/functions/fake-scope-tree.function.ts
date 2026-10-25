/**
 * Stackra file contract:
 * Purpose: `fakeScopeTree(paths, levels)`, the scope tree a test starts from: a `MemoryScopeTreeDriver` holding a node
 *          for each path (and each of its ancestors), with `scopeRefOf` ids, the last label as the name, and the level
 *          by depth from the levels given (the deepest given level repeats for deeper nodes).
 * Boundary: test code only; ready for `.override(ScopeTree, fakeScopeTree([...]))`. Levels are the test's data, never
 *           a vocabulary this package fixes; the default is `ScopeConfig`'s own default levels.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3); ADR 0327 (decisions 2, 3 and 10).
 */
import type { ScopeEntry } from "#contracts/index";
import { MemoryScopeTreeDriver } from "#core/index";
import { scopeRefOf } from "#testing/functions/scope-ref-of.function";

/**
 * A tree holding `paths` and their ancestors.
 *
 * @throws RangeError when a path is not a scope path, or `levels` is empty.
 * @example
 * createTestingModule(AppModule).override(ScopeTree, fakeScopeTree(["platform.acme.shop_eu"])).compile();
 */
export function fakeScopeTree(
  paths: readonly string[],
  levels: readonly string[] = ["platform", "product"],
): MemoryScopeTreeDriver {
  if (levels.length === 0) throw new RangeError("fakeScopeTree needs at least one level");
  const entries = new Map<string, ScopeEntry>();
  for (const path of paths) {
    const labels = path.split(".");
    labels.forEach((label, depth) => {
      const at = labels.slice(0, depth + 1).join(".");
      if (entries.has(at)) return;
      const level = levels[Math.min(depth, levels.length - 1)] ?? label;
      entries.set(at, { ...scopeRefOf(at), level, name: label });
    });
  }
  return new MemoryScopeTreeDriver([...entries.values()]);
}
