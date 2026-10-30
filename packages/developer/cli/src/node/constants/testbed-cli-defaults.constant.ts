/**
 * Stackra file contract:
 * Purpose: `TESTBED_CLI_DEFAULTS`, the defaults of `stackra testbed`: AWS profile, region, key file, user, security group,
 *          the SSM parameter of the image, the group name prefix, the instance tag and the fallback workflow.
 * Boundary: data only; every default is overridable by `STACKRA_TESTBED_*` or a flag, none is a secret.
 * Runtime: node
 * Governing contract: ADR 0484 (the testbed); ADR 0282 (decision 3).
 */

/** Defaults of `stackra testbed` (the agent contract names them). */
export const TESTBED_CLI_DEFAULTS = {
  profile: "academorix",
  region: "eu-west-1",
  key: ".ssh/academorix-ci.pem",
  user: "ubuntu",
  securityGroup: "stackra-testbed",
  imageParameter: "/stackra/testbed/ami",
  groupPrefix: "stackra-testbed-",
  tag: "stackra:testbed",
  fallbackWorkflow: "testbed-fallback.yml",
} as const;
