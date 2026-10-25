/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: the template's `renderMail` value and `MemoryNotifier` type,
 *          plus a test double of each channel port, are exported, nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { MemoryNotifierDriver } from "#core/index";
import * as testing from "#testing/index";
import type { MemoryNotifier } from "#testing/index";

describe("@stackra/notifications/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "ChatTransportFake",
      "InAppStoreFake",
      "MailTransportFake",
      "SmsTransportFake",
      "renderMail",
    ]);
  });

  it("exports MemoryNotifier as a type", () => {
    expectTypeOf<MemoryNotifier>().toEqualTypeOf<MemoryNotifierDriver>();
  });
});
