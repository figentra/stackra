/**
 * Stackra file contract:
 * Purpose: `resolveTestbedSettings(values, env, home)`, the AWS profile, region, SSH key file and user: flag, then
 *          `STACKRA_TESTBED_*`, then the default.
 * Boundary: pure; names a key file, never reads or prints one.
 * Runtime: node
 * Governing contract: ADR 0484 (the testbed); ADR 0282 (decision 3).
 */
import { join } from "node:path";

import { TESTBED_CLI_DEFAULTS } from "#node/constants/testbed-cli-defaults.constant";
import type { TestbedSettings } from "#node/types/testbed-settings.type";

const text = (value: string | boolean | undefined): string | undefined =>
  typeof value === "string" && value !== "" ? value : undefined;

/**
 * The settings of one run.
 *
 * @param values - the parsed options (`profile`, `region`, `key`).
 * @param env - the environment (`STACKRA_TESTBED_AWS_PROFILE`, `STACKRA_TESTBED_REGION`, `STACKRA_TESTBED_SSH_KEY`).
 * @param home - the home directory the default key file lives under.
 * @example
 * resolveTestbedSettings({}, {}, "/Users/me").region; // "eu-west-1"
 */
export function resolveTestbedSettings(
  values: Readonly<Record<string, string | boolean | undefined>>,
  env: Readonly<Record<string, string | undefined>>,
  home: string,
): TestbedSettings {
  return {
    profile:
      text(values["profile"]) ??
      text(env["STACKRA_TESTBED_AWS_PROFILE"]) ??
      TESTBED_CLI_DEFAULTS.profile,
    region:
      text(values["region"]) ?? text(env["STACKRA_TESTBED_REGION"]) ?? TESTBED_CLI_DEFAULTS.region,
    key:
      text(values["key"]) ??
      text(env["STACKRA_TESTBED_SSH_KEY"]) ??
      join(home, TESTBED_CLI_DEFAULTS.key),
    user: TESTBED_CLI_DEFAULTS.user,
  };
}
