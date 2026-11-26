/**
 * Stackra file contract:
 * Purpose: `prepareEncoreService(service, root)`, the fix-up for the two rules `stackra validate --repository` holds a
 *          service to for Encore to build its app at the member root: `dependencies.encore.dev` becomes the reference
 *          literal version (`encoreReferenceVersion`), and tsconfig.json gets `paths` with each package.json `imports`
 *          key and its first target, resolved from the tsconfig's own folder, with no `baseUrl` (`encoreTsconfig`).
 * Boundary: writes the service's package.json and tsconfig.json, and only when their content changes, laid out as the
 *           repository's formatter leaves them (gen's `formatJson`); a tsconfig's header comments are kept. Does not touch pnpm-lock.yaml: run `pnpm install` after a pin change.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09, rule 4 as corrected 2026-11-10).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { formatJson } from "@stackra/gen";
import { encoreReferenceVersion } from "@stackra/repo-checks/node";

import { encoreTsconfig } from "#node/encore/functions/encore-tsconfig.function";

/**
 * Prepare one service for Encore.
 *
 * @param service - the service member directory.
 * @param root - the workspace root, whose package.json (`stackra.encore`) or `pnpm-workspace.yaml` names the version.
 * @throws Error when neither names an `encore.dev` version, or the service has no package.json.
 * @example
 * prepareEncoreService("/repo/services/orders", "/repo"); // ["package.json", "tsconfig.json"]
 */
export function prepareEncoreService(service: string, root: string): readonly string[] {
  const maybe = (name: string): string | undefined =>
    existsSync(join(root, name)) ? readFileSync(join(root, name), "utf8") : undefined;
  const version = encoreReferenceVersion(maybe("package.json"), maybe("pnpm-workspace.yaml"));
  if (version === undefined)
    throw new Error(
      "no encore.dev reference version: set the root package.json stackra.encore (or the default catalog's encore.dev)",
    );
  const packageFile = join(service, "package.json");
  if (!existsSync(packageFile)) throw new Error(`${packageFile} not found: run this in a service`);
  const changed: string[] = [];
  const write = (name: string, text: string): void => {
    const file = join(service, name);
    if (existsSync(file) && readFileSync(file, "utf8") === text) return;
    writeFileSync(file, text);
    changed.push(name);
  };

  const pkg = JSON.parse(readFileSync(packageFile, "utf8")) as {
    dependencies?: Record<string, string>;
    imports?: unknown;
  };
  pkg.dependencies = { ...pkg.dependencies, "encore.dev": version };
  write("package.json", formatJson(pkg));

  const tsconfigFile = join(service, "tsconfig.json");
  write(
    "tsconfig.json",
    encoreTsconfig(
      existsSync(tsconfigFile) ? readFileSync(tsconfigFile, "utf8") : undefined,
      pkg.imports,
    ),
  );
  return changed;
}
