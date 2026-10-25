/**
 * Stackra file contract:
 * Purpose: type tests of `TillCredential`: the two stages and nullable issued values.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { TillCredential } from "#contracts/types/till-credential.type";

describe("TillCredential", () => {
  it("takes a compliance credential and refuses another stage", () => {
    const credential: TillCredential = {
      unitId: "till_1",
      stage: "compliance",
      requestId: "1",
      token: "t",
      secret: "s",
      certificate: null,
      certificateSerial: null,
    };
    // @ts-expect-error -- only compliance or production
    const draft: TillCredential = { ...credential, stage: "draft" };
    expect([credential.stage, draft.stage]).toEqual(["compliance", "draft"]);
  });
});
