/**
 * Stackra file contract:
 * Purpose: `checkShellCompatibility(request)`, the shell compatibility gate: in every product checkout, builds the
 *          product's bundles against the next shell's import map, then refuses a bundle whose `targets` the edge will
 *          not serve or which imports a specifier the next import map does not resolve.
 * Boundary: runs the configured build through the command runner, then reads files. Collects every issue of every
 *           product before it throws, so one run lists all the breaks. Matches the import map as the browser does
 *           (an exact key, or a key ending in `/` as a prefix), the same rule as @stackra/vite-plugin's
 *           `importMapResolves`, which runway cannot import (vite-plugin depends on runway).
 * Runtime: node
 * Governing contract: app-shells 15 (point 7: a contract test builds every product bundle against the next shell;
 *                     the edge refuses a release whose `targets: console@N` it does not serve) and 16 (point 3);
 *                     owner decision D7 (one version line; this check stops broken releases).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { EDGE_PUBLISH_SETTINGS } from "#node/constants/edge-publish-settings.constant";
import { bundleSurfaces } from "#node/functions/bundle-surfaces.function";
import { readBundles } from "#node/functions/read-bundles.function";
import { readRunway } from "#node/functions/read-runway.function";
import { runCommand } from "#node/functions/run-command.function";
import type { CompatibilityRequest } from "#node/types/compatibility-request.type";

/** The import map keys of `file`. */
function importKeys(file: string): string[] {
  let map: unknown;
  try {
    map = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new RunwayInvalidError(file, [
      { path: "", message: `Not readable as JSON: ${(error as Error).message}` },
    ]);
  }
  const imports = (map as { imports?: unknown } | null)?.imports;
  if (typeof imports !== "object" || imports === null || Array.isArray(imports))
    throw new RunwayInvalidError(file, [{ path: "imports", message: "Expected an import map" }]);
  return Object.keys(imports);
}

/**
 * Throws unless every product bundle builds against the next shell and targets a served line.
 *
 * @throws RunwayInvalidError listing every unserved target, unresolved import, missing bundle or failed build.
 * @example
 * await checkShellCompatibility({ repositories, importMap: "dist/console/import-map.json", served: ["console@3"] });
 */
export async function checkShellCompatibility(request: CompatibilityRequest): Promise<void> {
  const keys = importKeys(request.importMap);
  const resolves = (specifier: string): boolean =>
    keys.some((key) => key === specifier || (key.endsWith("/") && specifier.startsWith(key)));
  const run = request.run ?? runCommand;
  const command = request.command ?? EDGE_PUBLISH_SETTINGS.compatibility.command;
  const args = (request.args ?? EDGE_PUBLISH_SETTINGS.compatibility.args).map((arg) =>
    arg.replaceAll("{importMap}", request.importMap),
  );
  const issues: RunwayIssue[] = [];
  for (const repository of request.repositories) {
    try {
      const surfaces = bundleSurfaces(readRunway(join(repository, "runway.yaml"), "root"));
      if (surfaces.length === 0) continue;
      await run(command, args, { cwd: repository });
      for (const bundle of readBundles(repository, surfaces)) {
        const at = `${repository}:surfaces.${bundle.surface}`;
        if (!request.served.includes(bundle.manifest.targets))
          issues.push({
            path: `${at}.targets`,
            message: `Targets ${bundle.manifest.targets}, which the edge will not serve (${request.served.join(", ")})`,
          });
        for (const specifier of bundle.manifest.imports.filter((name) => !resolves(name)))
          issues.push({
            path: `${at}.imports`,
            message: `The next shell's import map does not resolve "${specifier}"`,
          });
      }
    } catch (error) {
      if (error instanceof RunwayInvalidError)
        issues.push(
          ...error.issues.map((issue) => ({ ...issue, path: `${repository}:${issue.path}` })),
        );
      else
        issues.push({ path: repository, message: `The build failed: ${(error as Error).message}` });
    }
  }
  if (issues.length > 0) throw new RunwayInvalidError("shell compatibility", issues);
}
