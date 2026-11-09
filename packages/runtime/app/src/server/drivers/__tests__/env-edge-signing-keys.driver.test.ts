/**
 * Stackra file contract:
 * Purpose: unit tests of `EnvEdgeSigningKeysDriver`: it answers the configured keys newest first with blanks dropped,
 *          and no key at all when the secret is unset.
 * Boundary: test only; the config is built from the shipped schema.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0437 (decision 4).
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { EdgeConfig as BaseEdgeConfig } from "#config/edge.config";
import { EnvEdgeSigningKeysDriver } from "#server/drivers/env-edge-signing-keys.driver";

describe("EnvEdgeSigningKeysDriver", () => {
  it("answers the configured keys, newest first, blanks dropped", async () => {
    class EdgeConfig extends BaseEdgeConfig {
      override signingKeys = " next , ,previous ";
    }
    expect(await new EnvEdgeSigningKeysDriver(buildConfig(EdgeConfig)).active()).toEqual([
      "next",
      "previous",
    ]);
  });

  it("answers no key when the secret is unset", async () => {
    expect(await new EnvEdgeSigningKeysDriver(buildConfig(BaseEdgeConfig)).active()).toEqual([]);
  });
});
