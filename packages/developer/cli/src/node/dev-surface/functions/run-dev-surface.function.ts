/**
 * Stackra file contract:
 * Purpose: `runDevSurface(context)`, the run of `stackra dev --surface <surface>` at the product root: read the
 *          surface from the root runway, plan the shell and API, run `stackra gen` (which writes the surface's
 *          bundle-mode Vite config), write the `DevSurface` descriptor beside that config, then start Vite, or with
 *          `--os` the local shell's own Vite, which serves the product packages from source, and wait for them.
 * Boundary: the CLI parses, plans and starts processes; the import map, hot reload and API proxy are the bundle-mode
 *           Vite config's work (gen and `@stackra/vite-plugin`, stackra-04). A gen refusal or a missing surface config
 *           stops before any process starts and exits 1.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6); app-shells section 15 point 2; ADR 0295 (decision 5: tools read the
 *                     configs gen writes).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { DEV_SURFACE_FILES } from "#node/dev-surface/constants/dev-surface-files.constant";
import { planDevSurface } from "#node/dev-surface/functions/plan-dev-surface.function";
import { readSurface } from "#node/dev-surface/functions/read-surface.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { runProcess } from "#node/functions/run-process.function";
import type { CliContext } from "#node/types/cli-context.type";

/** A surface key: lower-case kebab, so it is safe as a path segment. */
const SURFACE_KEY = /^[a-z][a-z0-9-]*$/;

/** The string value of option `name`, if given. */
function text(values: CliContext["values"], name: string): string | undefined {
  const value = values[name];
  return typeof value === "string" ? value : undefined;
}

/**
 * Runs one product surface in its shell and resolves with the exit code.
 *
 * @param context - the parsed `stackra dev --surface` command line.
 * @param surface - the surface key; `--surface` when absent.
 * @param gen - run `stackra gen` first; `--product` runs it once for every surface.
 * @throws CliUsageError when the surface or a flag is wrong.
 * @example
 * await runDevSurface({ ...context, values: { surface: "console", os: "../os" } });
 */
export async function runDevSurface(
  context: CliContext,
  surface = text(context.values, "surface") ?? "",
  gen = true,
): Promise<number> {
  const { cwd, io, values, cli } = context;
  if (!SURFACE_KEY.test(surface)) throw new CliUsageError(`bad surface key: ${surface}`);
  if (values["target"] !== undefined) {
    throw new CliUsageError("--target picks an app's target; --surface runs a product surface");
  }

  const entry = readSurface(cwd, surface);
  const { descriptor, runs } = planDevSurface(cwd, surface, entry, {
    os: text(values, "os"),
    shell: text(values, "shell"),
    shellOrigin: text(values, "shell-origin") ?? process.env["STACKRA_SHELL_ORIGIN"],
    api: text(values, "api"),
  });

  if (gen && (await cli(["gen"], io)) !== 0) return 1;
  // A local shell serves the packages itself; only a published shell needs gen's bundle-mode Vite config.
  if (!descriptor.shell.local && !existsSync(join(cwd, DEV_SURFACE_FILES.viteConfig(surface)))) {
    io.err(
      `stackra dev: gen wrote no ${DEV_SURFACE_FILES.viteConfig(surface)}; the surface bundle mode is not available yet\n`,
    );
    return 1;
  }
  mkdirSync(join(cwd, DEV_SURFACE_FILES.dir(surface)), { recursive: true });
  writeFileSync(
    join(cwd, DEV_SURFACE_FILES.descriptor(surface)),
    `${JSON.stringify(descriptor, null, 2)}\n`,
  );
  io.out(
    `surface ${surface}: shell ${descriptor.shell.ref} from ${descriptor.shell.url}, API ${descriptor.api}\n`,
  );

  // shortcut: the processes run side by side and share the terminal; Ctrl-C stops both through the process group.
  const codes = await Promise.all(runs.map((run) => runProcess(run, io)));
  return codes.find((code) => code !== 0) ?? 0;
}
