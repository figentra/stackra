/**
 * Stackra file contract:
 * Purpose: `lineScope(flag, packages)`, the npm scope a product's shell and template lines are published under: the
 *          `--scope` flag, else `STACKRA_LINE_SCOPE`, else the scope of the product's own packages that the root runway
 *          names (a Figentra product's packages and its lines share `@figentra`).
 * Boundary: pure apart from the environment read; refuses when nothing names a scope.
 * Runtime: node
 * Governing contract: ADR 0481 (decision 4: Runway names no owner's scope; the caller passes it).
 */
import { CliUsageError } from "#node/errors/cli-usage.error";

/**
 * The lines' scope.
 *
 * @throws CliUsageError when neither the flag, the environment nor a scoped product package names one.
 * @example
 * lineScope(undefined, ["@figentra/acme-example"]); // "@figentra"
 */
export function lineScope(flag: string | undefined, packages: readonly string[]): string {
  const scope =
    flag ??
    process.env["STACKRA_LINE_SCOPE"] ??
    packages.find((name) => name.startsWith("@"))?.split("/")[0];
  if (scope === undefined || scope === "")
    throw new CliUsageError("name the lines' npm scope: --scope <@scope> or STACKRA_LINE_SCOPE");
  return scope;
}
