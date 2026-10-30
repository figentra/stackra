/**
 * Stackra file contract:
 * Purpose: `runSmoke(context, drivers?)`, the run of `stackra smoke --env <environment> [--only web,mobile,desktop]
 *          [--app <key> --ios <.app> --android <.apk> --template-dir <dir>]` at a product root, after a preview
 *          deploy: Runway's `smokePreview` checks each web surface's preview host and the given mobile builds, prints
 *          one line per result with its problems and evidence, and exits 1 when any failed, so the promote job that
 *          needs it does not run.
 * Boundary: the CLI parses the flags and delegates; the drivers are Runway's (`PlaywrightSmokeDriver`,
 *           `MaestroSmokeDriver`, `ElectronSmokeDriver`), and a test passes its own. One CI job runs one `--only`
 *           target: web on Linux, iOS on the Mac runner, Android on Linux with KVM.
 * Runtime: node
 * Governing contract: STA-265 spec (D5, D6, FR-009, FR-013).
 */
import { RunwayEnvironment, RunwaySmokeFailedError } from "@stackra/runway";
import type { SmokeDriver, SmokeResult, SmokeSubject } from "@stackra/runway";
import {
  ElectronSmokeDriver,
  MaestroSmokeDriver,
  PlaywrightSmokeDriver,
  smokePreview,
} from "@stackra/runway/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliContext } from "#node/types/cli-context.type";

const TARGETS = ["web", "mobile", "desktop"] as const;

/** A string flag, or undefined. */
function text(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/** One result as a line, its problems indented below it. */
function lineOf(result: SmokeResult): string {
  const evidence = result.evidence === undefined ? "" : ` (${result.evidence})`;
  const head = `${result.passed ? "pass" : "FAIL"} ${result.target} ${result.name}${evidence}\n`;
  return head + result.problems.map((problem) => `  ${problem}\n`).join("");
}

/**
 * Runs the smoke step and resolves with the exit code: 0 when every subject passed, 1 otherwise.
 *
 * @param drivers - the smoke drivers; Runway's three when absent.
 * @throws CliUsageError when the environment or a target is unknown, or `--ios`/`--android` come without `--app`
 *         and `--template-dir`.
 * @example
 * await runSmoke({ ...context, values: { env: "preview", only: "web" } });
 */
export async function runSmoke(
  context: CliContext,
  drivers: readonly SmokeDriver[] = [
    new PlaywrightSmokeDriver(),
    new MaestroSmokeDriver(),
    new ElectronSmokeDriver(),
  ],
): Promise<number> {
  const { cwd, io, values } = context;
  const environment = text(values["env"]);
  if (
    environment === undefined ||
    !(Object.values(RunwayEnvironment) as string[]).includes(environment)
  )
    throw new CliUsageError(
      `name the environment: --env <${Object.values(RunwayEnvironment).join("|")}>`,
    );
  const only = text(values["only"])
    ?.split(",")
    .map((item) => item.trim());
  const unknown = only?.filter((item) => !(TARGETS as readonly string[]).includes(item)) ?? [];
  if (unknown.length > 0)
    throw new CliUsageError(`unknown target ${unknown.join(", ")}: --only <${TARGETS.join(",")}>`);
  const app = text(values["app"]);
  const ios = text(values["ios"]);
  const android = text(values["android"]);
  const templateDir = text(values["template-dir"]);
  if (
    (ios !== undefined || android !== undefined) &&
    (app === undefined || templateDir === undefined)
  )
    throw new CliUsageError("a mobile build needs --app <key> and --template-dir <line checkout>");

  try {
    const results = await smokePreview({
      repository: cwd,
      environment: environment as RunwayEnvironment,
      drivers,
      ...(only === undefined ? {} : { only: only as SmokeSubject["target"][] }),
      ...(app === undefined ? {} : { builds: { [app]: { ios, android } } }),
      ...(templateDir === undefined ? {} : { templateDir }),
    });
    for (const result of results) io.out(lineOf(result));
    io.out(`smoke passed: ${results.length} checked\n`);
    return 0;
  } catch (error) {
    if (!(error instanceof RunwaySmokeFailedError)) throw error;
    for (const result of error.results) io.out(lineOf(result));
    io.err(`${error.message}\n`);
    return 1;
  }
}
