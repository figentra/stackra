/**
 * Stackra file contract:
 * Purpose: `runningEnvironment(runtime, raw)`, the running Stackra environment (`STACKRA_ENVIRONMENT`) of a server
 *          app: the variable when it is set, otherwise derived from where the serving runtime runs. A local runtime
 *          (`cloud` is `local`: `encore run`, `encore test`) is `dev`, or `test` for a test run. A deployed runtime
 *          (any other cloud) is its environment's name when that is a deployed runway environment (`preview`,
 *          `staging`, `production`), else by its type: `production` is `production`, `ephemeral` is `preview`, any
 *          other is `staging`. A deployed runtime is never `dev` or `test`, and one that sets either is refused, so a
 *          deployment fails closed on every check that `dev` relaxes (the audit trail, STA-1571).
 * Boundary: pure; reads only its arguments. With no runtime provided (a hand-built app in a unit test) it returns the
 *           variable as it is, unset included, so `stackra dev` and vitest keep `dev` as the unset default.
 * Runtime: node
 * Governing contract: ADR 0170 (decision 5: the four environments); ADR 0212 (decisions 1 and 4), STA-1571.
 */
import { ConfigInvalidError } from "@stackra/config";

import type { RuntimeEnvironment } from "#server/types/runtime-environment.type";

/** The variable that names the running environment. */
const VARIABLE = "STACKRA_ENVIRONMENT";

/** The runway environments a deployed runtime may run as. */
const DEPLOYED: ReadonlySet<string> = new Set(["preview", "staging", "production"]);

/** The names a deployed runtime may not run as: they relax the checks a deployment keeps (the audit trail). */
const UNDEPLOYED: ReadonlySet<string> = new Set(["dev", "test", ""]);

/** The deployed environment of a runtime whose name is not a runway environment, by its type. */
const BY_TYPE: Readonly<Record<string, string>> = {
  production: "production",
  ephemeral: "preview",
};

/**
 * The running environment, or undefined when nothing names it (no runtime and no variable: the readers' `dev`).
 *
 * @param runtime - the serving runtime's environment, or undefined when none was provided.
 * @param raw - the raw environment (`process.env`).
 * @throws ConfigInvalidError when a deployed runtime sets `STACKRA_ENVIRONMENT` to `dev`, `test` or nothing.
 * @example
 * runningEnvironment({ name: "acme-prod", type: "production", cloud: "aws" }, {}); // "production"
 * runningEnvironment({ name: "local", type: "development", cloud: "local" }, {}); // "dev"
 */
export function runningEnvironment(
  runtime: RuntimeEnvironment | undefined,
  raw: Readonly<Record<string, string | undefined>>,
): string | undefined {
  const named = raw[VARIABLE];
  if (runtime === undefined) return named;
  if (runtime.cloud === "local") return named ?? (runtime.type === "test" ? "test" : "dev");
  if (named !== undefined) {
    if (!UNDEPLOYED.has(named)) return named;
    throw new ConfigInvalidError("env", [
      {
        path: VARIABLE,
        message:
          `${VARIABLE} names dev, test or nothing in a deployed runtime (cloud ${runtime.cloud}): dev and test run ` +
          "only on a developer machine; set preview, staging or production, or leave it unset",
      },
    ]);
  }
  if (DEPLOYED.has(runtime.name)) return runtime.name;
  return BY_TYPE[runtime.type] ?? "staging";
}
