/**
 * Stackra file contract:
 * Purpose: `runningEnvironment(declared, host)`, the `STACKRA_ENVIRONMENT` a server process runs as, from the declared
 *          variable and what the host runtime reports (Encore's `appMeta().environment`). Nothing sets the variable on a
 *          deployed Encore service, so the generated Encore app derives it: a `production` environment runs as
 *          `production`, an `ephemeral` one as `preview`, any other environment in a cloud as its name when that is
 *          `preview`, `staging` or `production`, else `staging`. A deployed process never runs as `dev` or `test`, so
 *          the configuration that refuses dev-only drivers (the memory action stores) sees the deployment.
 * Boundary: pure. `encore run` and `encore test` (cloud `local`, name `local` or `test`) keep the declared value, unset
 *           reading as `dev`. A declared value wins elsewhere, except `dev` or `test` in a deployed environment, which
 *           throws. A host that reports nothing usable (a self-hosted build without infra metadata) and no declared
 *           value throws too: unknown fails closed, never as `dev`. Throws `ConfigInvalidError` naming the variable.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: memory first, a production driver before production); ADR 0091 (decision
 *                     2) and ADR 0124 (Encore facts come from the generated app); ADR 0146 (a bad environment fails
 *                     boot); STA-2798.
 */
import { ConfigInvalidError } from "@stackra/config";

import type { HostEnvironment } from "#server/types/host-environment.type";

/** The variable this decides. */
const VARIABLE = "STACKRA_ENVIRONMENT";

/** The environments a deployment runs as. */
const DEPLOYED: ReadonlySet<string> = new Set(["preview", "staging", "production"]);

/** The environments only a developer's machine or a test run may declare. */
const LOCAL: ReadonlySet<string> = new Set(["dev", "test"]);

/** The deployed environment `host` reports, or undefined when it reports a local run or nothing usable. */
function deployedOf(host: HostEnvironment): string | undefined {
  if (host.type === "production") return "production";
  if (host.type === "ephemeral") return "preview";
  if (host.cloud === "local") return undefined;
  return DEPLOYED.has(host.name) ? host.name : "staging";
}

/**
 * The environment the process runs as: the value to put in `STACKRA_ENVIRONMENT`, or undefined to leave it unset
 * (`encore run` without a declared value, which reads as `dev`).
 *
 * @param declared - `process.env.STACKRA_ENVIRONMENT`.
 * @param host - what the host runtime reports, Encore's `appMeta().environment`.
 * @throws ConfigInvalidError when a deployed environment declares `dev` or `test`, or nothing tells the environment.
 * @example
 * runningEnvironment(undefined, { name: "prod-eu", type: "production", cloud: "aws" }); // "production"
 * runningEnvironment(undefined, { name: "local", type: "development", cloud: "local" }); // undefined (dev)
 */
export function runningEnvironment(
  declared: string | undefined,
  host: HostEnvironment,
): string | undefined {
  const given = declared === "" ? undefined : declared;
  if (host.cloud === "local" && (host.name === "local" || host.name === "test")) return given;
  const deployed = deployedOf(host);
  const reported = `${host.type} environment "${host.name}" on ${host.cloud}`;
  if (given !== undefined) {
    if (deployed !== undefined && LOCAL.has(given))
      throw new ConfigInvalidError("env", [
        {
          path: VARIABLE,
          message: `is ${given}, but the host runs a deployed ${reported}: a deployment never runs as dev or test`,
        },
      ]);
    return given;
  }
  if (deployed !== undefined) return deployed;
  throw new ConfigInvalidError("env", [
    {
      path: VARIABLE,
      message:
        `is not set, and the host reports no deployed environment (${reported}): set ${VARIABLE}, or the ` +
        "infra config's metadata env_type and cloud",
    },
  ]);
}
