/**
 * Stackra file contract:
 * Purpose: unit tests of `MessageKind`: the two codes of the `kind` column, in order, as an `Enum.of` value.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MessageKind } from "#contracts/enums/message-kind.enum";

describe("MessageKind", () => {
  it("lists the message kinds in order", () => {
    expect(Enum.values(MessageKind)).toEqual(["event", "change"]);
  });

  it("names each case", () => {
    expect(MessageKind.Event).toBe("event");
    expect(MessageKind.Change).toBe("change");
    expectTypeOf<MessageKind>().toEqualTypeOf<"event" | "change">();
  });
});
