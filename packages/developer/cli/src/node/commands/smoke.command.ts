/**
 * Stackra file contract:
 * Purpose: `SmokeCommand`, `stackra smoke --env <environment> [--only web,mobile,desktop] [--app <key> --ios <.app>
 *          --android <.apk> --template-dir <dir>]`: the smoke step after a preview deploy (`runSmoke`), drawn as a
 *          checklist with one row per subject under its target (its problems and evidence as the detail). Exits 1
 *          when a subject failed, so the promote job that needs it does not run; 2 for a bad flag.
 * Boundary: flags and drawing only; the checks are `runSmoke`'s, and the drivers keep their own processes.
 * Runtime: node
 * Governing contract: STA-265 spec (D6, FR-013); ADR 0506; STA-1966.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { runSmoke } from "#node/product/functions/run-smoke.function";

/** Smoke-checks a product after a preview deploy. */
export class SmokeCommand extends Command({
  name: "smoke",
  description:
    "Smoke-check a product after a preview deploy: web surfaces with Playwright, mobile builds with Maestro; blocks promotion",
  bin: true,
}) {
  /** The environment the preview runs in. */
  @Option({ description: "The environment the preview was deployed to (required)" })
  @Str
  env?: string;

  /** The targets to check. */
  @Option({ description: "Only these targets, comma-separated: web, mobile, desktop" })
  @Str
  only?: string;

  /** The mobile app of the given builds. */
  @Option({ description: "The mobile app key the --ios or --android build belongs to" })
  @Str
  app?: string;

  /** An iOS simulator build. */
  @Option({ description: "An iOS simulator build (.app) of --app" })
  @Str
  ios?: string;

  /** An Android build. */
  @Option({ description: "An Android build (.apk) of --app" })
  @Str
  android?: string;

  /** The line checkout with the app's flows. */
  @Option({ description: "The line checkout that holds the mobile template's flows" })
  @Str
  templateDir?: string;

  /** Runs the smoke step and draws the results. */
  async handle(io: CommandIo): Promise<number> {
    const { results, failure } = await runSmoke(io.cwd, {
      env: this.env,
      only: this.only,
      app: this.app,
      ios: this.ios,
      android: this.android,
      "template-dir": this.templateDir,
    });
    io.output.checklist({
      rows: results.map(({ target, name, passed, problems, evidence }) => {
        const detail = [...problems, ...(evidence === undefined ? [] : [evidence])].join("; ");
        return {
          name,
          status: passed ? ("ok" as const) : ("fail" as const),
          group: target,
          ...(detail === "" ? {} : { detail }),
        };
      }),
    });
    if (failure === undefined) return 0;
    io.output.error(failure);
    return 1;
  }
}
