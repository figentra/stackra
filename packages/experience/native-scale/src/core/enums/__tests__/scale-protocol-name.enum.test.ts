/**
 * Stackra file contract:
 * Purpose: unit tests of `ScaleProtocolName`: its wire values, each a key of the shipped protocol pack.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 5).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SCALE_PROTOCOLS } from "#core/constants/scale-protocols.constant";
import { ScaleProtocolName } from "#core/enums/scale-protocol-name.enum";

describe("ScaleProtocolName", () => {
  it("keeps its wire values, one per shipped protocol", () => {
    expect(Enum.values(ScaleProtocolName)).toEqual(["mt_sics", "continuous_ascii"]);
    expect(Object.keys(SCALE_PROTOCOLS).sort()).toEqual([...Enum.values(ScaleProtocolName)].sort());
  });
});
