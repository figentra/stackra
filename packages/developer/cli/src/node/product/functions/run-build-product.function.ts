/**
 * Stackra file contract:
 * Purpose: `runBuildProduct(context)`, the run of `stackra build --product [--dry-run] [--surfaces-only] [--os <checkout>]
 *          [--scope <@scope>] [--env <environment>]` at a product root: every web surface's extension bundle and every
 *          mobile app's EAS build (Runway's `buildProduct`, bundled with Vite), and the build manifest
 *          `dist/product/build.json`. `--dry-run` plans the bundles and records the EAS builds instead.
 * Boundary: the CLI reads the root runway, resolves the lines' scope and delegates to Runway; the product's CI calls it.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); ADR 0439 (decision 2); ADR 0441 (decision 3); ADR 0481.
 */
import { join } from "node:path";

import { RunwayEnvironment } from "@stackra/runway";
import { buildProduct, PRODUCT_BUILD_SETTINGS, readRunway } from "@stackra/runway/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { lineScope } from "#node/product/functions/line-scope.function";
import { productPackages } from "#node/product/functions/product-packages.function";
import { viteBundler } from "#node/product/functions/vite-bundler.function";
import type { CliContext } from "#node/types/cli-context.type";

/** The string value of option `name`, if given. */
function text(values: CliContext["values"], name: string): string | undefined {
  const value = values[name];
  return typeof value === "string" ? value : undefined;
}

/**
 * Builds the product and resolves with the exit code.
 *
 * @throws CliUsageError when the environment or the scope is wrong.
 * @example
 * await runBuildProduct({ ...context, values: { product: true, "dry-run": true } });
 */
export async function runBuildProduct(context: CliContext): Promise<number> {
  const { cwd, io, values } = context;
  const environment = text(values, "env") ?? RunwayEnvironment.Production;
  if (!(Object.values(RunwayEnvironment) as string[]).includes(environment))
    throw new CliUsageError(`unknown environment: ${environment}`);
  const root = readRunway(join(cwd, "runway.yaml"), "root");
  const dryRun = values["dry-run"] === true;
  const os = text(values, "os");
  const build = await buildProduct({
    repository: cwd,
    scope: lineScope(text(values, "scope"), productPackages(root)),
    ...(os === undefined ? {} : { os }),
    environment: environment as RunwayEnvironment,
    dryRun,
    surfacesOnly: values["surfaces-only"] === true,
    bundle: viteBundler,
  });
  for (const [surface, built] of Object.entries(build.surfaces))
    io.out(
      `surface ${surface}: ${built.shell.package}@${built.shell.version}, ${built.packages.length} package(s), ${built.bundle === undefined ? (dryRun && built.packages.length > 0 ? "bundle planned" : "no bundle") : `bundle ${built.bundle.version}`}\n`,
    );
  for (const [app, built] of Object.entries(build.mobile))
    io.out(
      `mobile ${app}: ${built.template.package}@${built.template.version}, capabilities [${built.capabilities.join(", ")}], ${dryRun ? "EAS build recorded" : `EAS builds ${built.buildIds.join(", ") || "none"}`}\n`,
    );
  for (const app of build.skipped.mobile) io.out(`mobile ${app}: skipped (--surfaces-only)\n`);
  io.out(`wrote ${PRODUCT_BUILD_SETTINGS.manifest}${dryRun ? " (dry run)" : ""}\n`);
  return 0;
}
