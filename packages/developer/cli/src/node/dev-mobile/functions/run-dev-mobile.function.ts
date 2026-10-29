/**
 * Stackra file contract:
 * Purpose: `runDevMobile(context)`, the run of `stackra dev --mobile <app> --os <checkout> [--device <udid>]` at the
 *          product root: finds the app's template line in the local OS checkout (`<checkout>/apps/<name>`, its scope
 *          from that package's name), prepares `.stackra/mobile/<app>` with Runway's `prepareMobileDev` (the app's
 *          config and capabilities, the product packages' native entries, the line's installed node_modules), then
 *          prebuilds and runs it on the iOS simulator.
 * Boundary: the CLI reads the root runway and the line's package.json, delegates the checkout to Runway and starts
 *           the processes one after another; the device is `--device`, else `STACKRA_IOS_DEVICE`.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6); ADR 0439; ADR 0481.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { prepareMobileDev, readRunway } from "@stackra/runway/node";

import { planDevMobile } from "#node/dev-mobile/functions/plan-dev-mobile.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { runProcess } from "#node/functions/run-process.function";
import type { CliContext } from "#node/types/cli-context.type";

/** The string value of option `name`, if given. */
function text(values: CliContext["values"], name: string): string | undefined {
  const value = values[name];
  return typeof value === "string" ? value : undefined;
}

/**
 * Runs one product mobile app on the simulator and resolves with the exit code.
 *
 * @throws CliUsageError when the app, the checkout or the device is missing.
 * @example
 * await runDevMobile({ ...context, values: { mobile: "app", os: "../os", device: "A44ABE24-…" } });
 */
export async function runDevMobile(
  context: CliContext,
  app = text(context.values, "mobile"),
): Promise<number> {
  const { cwd, io, values } = context;
  const os = text(values, "os");
  const device = text(values, "device") ?? process.env["STACKRA_IOS_DEVICE"];
  if (app === undefined || !/^[a-z][a-z0-9-]*$/.test(app))
    throw new CliUsageError(`bad mobile app key: ${String(app)}`);
  if (os === undefined)
    throw new CliUsageError(
      "--mobile runs a local checkout of the template line: pass --os <checkout>",
    );
  if (device === undefined)
    throw new CliUsageError("name the simulator: --device <udid> or STACKRA_IOS_DEVICE");

  const entry = readRunway(join(cwd, "runway.yaml"), "root").mobile?.[app];
  if (entry === undefined) throw new CliUsageError(`unknown mobile app: ${app}`);
  const name = entry.template.split("/")[1]?.split("@")[0] ?? "";
  const local = resolve(cwd, os, "apps", name);
  if (!existsSync(join(local, "package.json")))
    throw new CliUsageError(`no ${name} template in the checkout: ${local} has no package.json`);
  if (!existsSync(join(local, "node_modules")))
    throw new CliUsageError(
      `the ${name} template is not installed: run pnpm install in ${resolve(cwd, os)}`,
    );
  const packageName = String(
    (JSON.parse(readFileSync(join(local, "package.json"), "utf8")) as { name?: unknown }).name,
  );
  const scope = packageName.split("/")[0] ?? "";

  const dev = await prepareMobileDev({
    repository: cwd,
    app,
    line: { scope, local },
    nodeModules: join(local, "node_modules"),
  });
  io.out(
    `mobile ${app}: ${dev.template.package}@${dev.template.version} in ${dev.dir}, ${dev.entries.length} package(s)\n`,
  );
  for (const run of planDevMobile(dev.dir, device)) {
    const code = await runProcess(run, io);
    if (code !== 0) return code;
  }
  return 0;
}
