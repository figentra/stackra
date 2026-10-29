/**
 * Stackra file contract:
 * Purpose: `runDevProduct(context)`, the run of `stackra dev --product --os <checkout> [--device <udid>]` at the
 *          product root: runs `stackra gen` once, then every web surface the root runway names in its local shell
 *          (`runDevSurface`) and every mobile app on the iOS simulator (`runDevMobile`), side by side, so one command
 *          brings up a product that has no app members.
 * Boundary: dispatch only; the surfaces and apps are planned and started by their own commands. `ops` is skipped:
 *           it has no shell of a product's (ADR 0436 decision 9). Resolves with the first non-zero exit code.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 2 and 6); ADR 0441 (decisions 2 and 3); ADR 0439.
 */
import { join } from "node:path";

import { readRunway } from "@stackra/runway/node";

import { runDevMobile } from "#node/dev-mobile/functions/run-dev-mobile.function";
import { runDevSurface } from "#node/dev-surface/functions/run-dev-surface.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliContext } from "#node/types/cli-context.type";

/**
 * Runs the whole product locally and resolves with the exit code.
 *
 * @throws CliUsageError when there is no local checkout or nothing to run.
 * @example
 * await runDevProduct({ ...context, values: { product: true, os: "../os", device: "A44ABE24-…" } });
 */
export async function runDevProduct(context: CliContext): Promise<number> {
  const { cwd, io, cli, values } = context;
  if (typeof values["os"] !== "string")
    throw new CliUsageError("--product runs the local shells and template: pass --os <checkout>");
  const root = readRunway(join(cwd, "runway.yaml"), "root");
  const surfaces = Object.keys(root.surfaces ?? {}).filter((surface) => surface !== "ops");
  const apps = Object.keys(root.mobile ?? {});
  if (surfaces.length + apps.length === 0)
    throw new CliUsageError("runway.yaml names no surfaces and no mobile apps");
  io.out(
    `product ${root.product?.key ?? root.project}: ${[...surfaces, ...apps.map((app) => `mobile.${app}`)].join(", ")}\n`,
  );
  if ((await cli(["gen"], io)) !== 0) return 1;
  // shortcut: the runs share the terminal and stop together on Ctrl-C (one process group).
  const codes = await Promise.all([
    ...surfaces.map((surface) => runDevSurface(context, surface, false)),
    ...apps.map((app) => runDevMobile(context, app)),
  ]);
  return codes.find((code) => code !== 0) ?? 0;
}
