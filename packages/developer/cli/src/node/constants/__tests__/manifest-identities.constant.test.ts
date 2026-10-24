/**
 * Stackra file contract:
 * Purpose: unit tests of `MANIFEST_IDENTITIES`: each listed manifest section names the field of its derived identity.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { MANIFEST_IDENTITIES } from "#node/constants/manifest-identities.constant";

describe("MANIFEST_IDENTITIES", () => {
  it("names the identity field of each listed section", () => {
    expect(MANIFEST_IDENTITIES).toEqual({
      modules: "key",
      actions: "key",
      events: "name",
      permissions: "key",
      errors: "code",
      models: "key",
      drivers: "key",
    });
  });
});
