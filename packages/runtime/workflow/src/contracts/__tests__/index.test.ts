/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `ServiceAcked` and `KeptRecords$` are exported and
 *          nothing else is as a value, and the event keeps its wire name source (`service.acked`).
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15);
 *                     STA-2567.
 */
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

describe("@stackra/workflow/contracts", () => {
  it("exports exactly the service-acked contract", () => {
    expect(Object.keys(contracts).sort()).toEqual(["KeptRecords$", "ServiceAcked"]);
  });

  it("builds a ServiceAcked", () => {
    const acked = contracts.ServiceAcked.create({ subject: "ten_1", service: "commerce" });
    expect(acked.service).toBe("commerce");
  });
});
