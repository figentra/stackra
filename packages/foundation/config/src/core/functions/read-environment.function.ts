/**
 * Stackra file contract:
 * Purpose: `readEnvironment(raw, platform?)`, the one reader of the running environment (STA-2844): a closed list
 *          (`StackraEnvironment`), read from the runtime only, `STACKRA_ENVIRONMENT` in `raw` and what the serving
 *          platform reports, never from a configuration value. Every check that `dev` or `test` relaxes (memory stores,
 *          an unbound audit trail, dev sign-in, a memory scanner or nonce store) asks this reader, so they all agree.
 *          - A name outside the list (`prod`, a typo) is refused, never read as some environment.
 *          - With no platform (a developer tool, a unit test, a target no platform reports on) an unset variable is
 *            `dev`.
 *          - On a developer machine (`encore run`: cloud `local`, name `local`) unset is `dev`; in a local test run
 *            (`encore test`: cloud `local`, name and type `test`) unset is `test`.
 *          - On a deployed platform (type `production` or `ephemeral`, or any cloud other than `local`) unset is
 *            derived: `production` for type `production`, `preview` for `ephemeral`, else the platform's name when it
 *            is `preview`, `staging` or `production`, else `staging`. A deployed platform never runs as `dev` or
 *            `test`: a variable naming either is refused, and so is one that contradicts what the platform's type or
 *            name fixes (`staging` on a `production` platform).
 *          - A platform that reports neither (a self-hosted image without infra metadata: empty name, cloud `local`)
 *            is not a developer machine: unset is refused, so it fails closed instead of running as `dev`.
 * Boundary: pure; reads only its arguments and throws `ConfigInvalidError` (config `env`, path
 *           `STACKRA_ENVIRONMENT`) naming the rule, never the value.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (amendment 2026-11-26: the environment comes from the runtime only); ADR 0170
 *                     (decision 5); ADR 0146 (a bad environment fails boot); STA-2844.
 */
import { Enum } from "@stackra/contracts";

import { ENVIRONMENT_VARIABLE } from "#core/constants/environment-variable.constant";
import { StackraEnvironment } from "#core/enums/stackra-environment.enum";
import { ConfigInvalidError } from "#core/errors/config-invalid.error";
import type { PlatformEnvironment } from "#core/types/platform-environment.type";

/** The closed list, for membership checks. */
const KNOWN: ReadonlySet<string> = new Set(Enum.values(StackraEnvironment));

/** The environments a deployment runs as, which its platform may name. */
const DEPLOYED: ReadonlySet<string> = new Set([
  StackraEnvironment.Preview,
  StackraEnvironment.Staging,
  StackraEnvironment.Production,
]);

/** What a platform report says about the process. */
type Reading =
  | { readonly kind: "machine"; readonly unset: StackraEnvironment }
  | { readonly kind: "deployed"; readonly derived: StackraEnvironment; readonly fixed: boolean }
  | { readonly kind: "unknown" };

/** Classifies what `platform` reports. */
function readingOf(platform: PlatformEnvironment): Reading {
  if (platform.type === "production")
    return { kind: "deployed", derived: StackraEnvironment.Production, fixed: true };
  if (platform.type === "ephemeral")
    return { kind: "deployed", derived: StackraEnvironment.Preview, fixed: true };
  if (platform.cloud === "local") {
    if (platform.name === "local") return { kind: "machine", unset: StackraEnvironment.Dev };
    if (platform.name === "test" && platform.type === "test")
      return { kind: "machine", unset: StackraEnvironment.Test };
    return { kind: "unknown" };
  }
  return DEPLOYED.has(platform.name)
    ? { kind: "deployed", derived: platform.name as StackraEnvironment, fixed: true }
    : { kind: "deployed", derived: StackraEnvironment.Staging, fixed: false };
}

/** The refusal, naming the variable and the rule. */
const refuse = (message: string): ConfigInvalidError =>
  new ConfigInvalidError("env", [{ path: ENVIRONMENT_VARIABLE, message }]);

/**
 * The running environment.
 *
 * @param raw - the runtime environment (`process.env`, a Worker's bindings); only `STACKRA_ENVIRONMENT` is read.
 * @param platform - what the serving platform reports (Encore's `appMeta().environment`), or undefined when none does.
 * @throws ConfigInvalidError when the variable names no Stackra environment, when a deployed platform is named `dev`,
 *         `test` or an environment its type or name contradicts, or when nothing tells the environment of a platform
 *         that is not a developer machine.
 * @example
 * readEnvironment({}, { name: "acme-prod", type: "production", cloud: "aws" }); // "production"
 * readEnvironment({ STACKRA_ENVIRONMENT: "staging" }); // "staging"
 * readEnvironment({}); // "dev"
 */
export function readEnvironment(
  raw: Readonly<Record<string, unknown>>,
  platform?: PlatformEnvironment,
): StackraEnvironment {
  const value = raw[ENVIRONMENT_VARIABLE];
  const declared = typeof value === "string" ? value.trim() : value;
  if (declared !== undefined && declared !== "" && !KNOWN.has(declared as string))
    throw refuse(`is not a Stackra environment: set one of ${[...KNOWN].join(", ")}`);
  const named =
    declared === undefined || declared === "" ? undefined : (declared as StackraEnvironment);
  if (platform === undefined) return named ?? StackraEnvironment.Dev;
  const reading = readingOf(platform);
  const where = `the platform reports ${platform.type || "no"} type, ${platform.cloud || "no"} cloud`;
  if (reading.kind === "machine") return named ?? reading.unset;
  if (reading.kind === "unknown") {
    if (named !== undefined) return named;
    throw refuse(
      `is not set, and ${where} and no environment name, so this is no developer machine and no known deployment: ` +
        `set ${ENVIRONMENT_VARIABLE} in the runtime, or the infra config's metadata (env_type, cloud)`,
    );
  }
  if (named === undefined) return reading.derived;
  if (!DEPLOYED.has(named))
    throw refuse(
      `names a developer environment on a deployed platform (${where}): a deployment never runs as dev or test; ` +
        "set preview, staging or production, or leave it unset",
    );
  if (reading.fixed && named !== reading.derived)
    throw refuse(
      `contradicts the deployed platform (${where}), which runs as ${reading.derived}: leave it unset or set ` +
        reading.derived,
    );
  return named;
}
