/**
 * Stackra file contract:
 * Purpose: `SMOKE_COMMAND`, `stackra smoke --env <environment> [--only <targets>] [--app <key> --ios <.app>
 *          --android <.apk> --template-dir <dir>]`: the smoke step after a preview deploy (`runSmoke`).
 * Boundary: data plus dispatch.
 * Runtime: node
 * Governing contract: STA-265 spec (D6, FR-013).
 */
import { runSmoke } from "#node/product/functions/run-smoke.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra smoke` command definition. */
export const SMOKE_COMMAND: CliCommand = {
  name: "smoke",
  summary:
    "Smoke-check a product after a preview deploy: web surfaces with Playwright, mobile builds with Maestro; blocks promotion",
  usage:
    "stackra smoke --env <environment> [--only web,mobile,desktop] [--app <key> --ios <.app> --android <.apk> --template-dir <dir>]",
  options: {
    env: { type: "string" },
    only: { type: "string" },
    app: { type: "string" },
    ios: { type: "string" },
    android: { type: "string" },
    "template-dir": { type: "string" },
  },
  run: (context) => runSmoke(context),
};
