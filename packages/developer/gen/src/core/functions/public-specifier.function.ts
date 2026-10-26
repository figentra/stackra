/**
 * Stackra file contract:
 * Purpose: `publicSpecifier`, the specifier a host imports a package's class from, given the specifier the package's
 *          own source used: a subpath import (`#contracts/index`, `#core/drivers/x.driver`) becomes the entry that
 *          exports that folder (`@stackra/settings/contracts`, `@stackra/settings`); any other specifier is kept.
 * Boundary: pure. `#stackra/*` is a member's generated file, which no host can reach, so it is kept as written.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15: entry folders); ADR 0263 (a host's wiring lists its packages' drivers);
 *                     STA-1297.
 */
import { packageSpecifier } from "#core/functions/package-specifier.function";

/**
 * The public specifier of `from` in `pkg`.
 *
 * @example
 * publicSpecifier("@stackra/settings", "#contracts/index"); // "@stackra/settings/contracts"
 * publicSpecifier("@stackra/settings", "#core/drivers/memory-setting-value-store.driver"); // "@stackra/settings"
 * publicSpecifier("@stackra/settings", "@stackra/contracts"); // "@stackra/contracts"
 */
export function publicSpecifier(pkg: string, from: string): string {
  if (!from.startsWith("#") || from.startsWith("#stackra/")) return from;
  const folder = from.slice(1).split("/")[0] ?? "";
  return packageSpecifier(pkg, `src/${folder}/file.ts`);
}
