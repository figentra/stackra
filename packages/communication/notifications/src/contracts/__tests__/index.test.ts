/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the template's `MailTransport` value and `OutboundMail`
 *          type are exported, nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { OutboundMail } from "#contracts/index";

describe("@stackra/notifications/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["MailTransport"]);
  });

  it("exports OutboundMail as a type", () => {
    expectTypeOf<OutboundMail["subject"]>().toEqualTypeOf<string>();
  });
});
