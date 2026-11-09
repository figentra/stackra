/**
 * Stackra file contract:
 * Purpose: `runSmoke(cwd, values, drivers?)`, the run of `stackra smoke --env <environment> [--only web,mobile,desktop]
 *          [--app <key> --ios <.app> --android <.apk> --template-dir <dir>]` at a product root, after a preview
 *          deploy: Runway's `smokePreview` checks each web surface's preview host and the given mobile builds, and it
 *          resolves with every result and, when one failed, the failure, so `SmokeCommand` exits 1 and the promote job
 *          that needs it does not run.
 * Boundary: validates the flags and delegates; prints nothing (`SmokeCommand` draws the results). The drivers are
 *           Runway's (`PlaywrightSmokeDriver`, `MaestroSmokeDriver`, `ElectronSmokeDriver`), and a test passes its
 *           own. One CI job runs one `--only` target: web on Linux, iOS on the Mac runner, Android on Linux with KVM.
 * Runtime: node
 * Governing contract: STA-265 spec (D5, D6, FR-009, FR-013); ADR 0506; STA-1966.
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

const TARGETS = ["web", "mobile", "desktop"] as const;

/** A string flag, or undefined. */
function text(value: string | undefined): string | undefined {
  return value !== undefined && value.trim() !== "" ? value.trim() : undefined;
}

/**
 * Runs the smoke step and resolves with every result, and the failure's message when a subject failed.
 *
 * @param cwd - the product root.
 * @param values - the flags, by long name.
 * @param drivers - the smoke drivers; Runway's three when absent.
 * @throws CliUsageError when the environment or a target is unknown, or `--ios`/`--android` come without `--app`
 *         and `--template-dir`.
 * @example
 * const { results, failure } = await runSmoke(root, { env: "preview", only: "web" });
 */
export async function runSmoke(
  cwd: string,
  values: Readonly<Record<string, string | undefined>>,
  drivers: readonly SmokeDriver[] = [
    new PlaywrightSmokeDriver(),
    new MaestroSmokeDriver(),
    new ElectronSmokeDriver(),
  ],
): Promise<{ readonly results: readonly SmokeResult[]; readonly failure?: string }> {
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
    return { results };
  } catch (error) {
    if (!(error instanceof RunwaySmokeFailedError)) throw error;
    return { results: error.results, failure: error.message };
  }
}
