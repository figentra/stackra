/**
 * Stackra file contract:
 * Purpose: `rootModuleOf(dir)`, the root module a member authors, from its directory: `src/node/<name>.module.ts` in a
 *          package, `src/<name>.module.ts` elsewhere; null for a member `MEMBER_ROOT` exempts.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12); ADR 0295.
 */
import { MEMBER_ROOT } from "#node/constants/member-root.constant";

/**
 * The root module path a member at `dir` authors, or null when it is exempt.
 *
 * @param dir - repository-relative, forward slashes.
 * @example
 * rootModuleOf("services/notes"); // "src/notes.module.ts"
 */
export function rootModuleOf(dir: string): string | null {
  const name = dir.split("/").at(-1) ?? "";
  const exempt = MEMBER_ROOT.exempt.some((e) =>
    e.dir.endsWith("/") ? dir.startsWith(e.dir) : dir === e.dir,
  );
  if (exempt) return null;
  const pattern = dir.startsWith("packages/")
    ? MEMBER_ROOT.packageRootModule
    : MEMBER_ROOT.rootModule;
  return pattern.replace("<name>", name);
}
