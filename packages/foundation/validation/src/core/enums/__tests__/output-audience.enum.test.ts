/**
 * Stackra file contract:
 * Purpose: unit tests of `OutputAudience`: the four serializer audiences of ADR 0095, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0095 (decision 6).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { OutputAudience } from "#core/enums/output-audience.enum";

describe("OutputAudience", () => {
  it("holds the four audiences", () => {
    expect(Enum.values(OutputAudience)).toEqual(["public", "app", "admin", "agent"]);
  });
});
