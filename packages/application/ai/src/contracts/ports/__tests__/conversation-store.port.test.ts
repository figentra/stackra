/**
 * Stackra file contract:
 * Purpose: unit tests of the `ConversationStore` port: an abstract port class a driver extends, never constructed bare.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decision 10); STA-781.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ConversationStore } from "#contracts/ports/conversation-store.port";

describe("ConversationStore", () => {
  it("is a port", () => {
    expect(Object.getPrototypeOf(ConversationStore)).toBe(Port);
    expect(ConversationStore.name).toBe("ConversationStore");
  });
});
