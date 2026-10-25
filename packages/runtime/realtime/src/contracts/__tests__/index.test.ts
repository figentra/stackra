/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the template's gen samples import `RealtimeDriver` and
 *          `RealtimeTransport` from it, nothing else is a value, and the types it names resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { Realm } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  RealtimeBroadcast,
  RealtimeLink,
  RealtimeLinkHandlers,
  RealtimeMessage,
  RealtimeSession,
  RealtimeTarget,
} from "#contracts/index";

describe("@stackra/realtime/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "RealtimeDriver",
      "RealtimeFanout",
      "RealtimeTransport",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<RealtimeMessage>().toEqualTypeOf<{
      readonly channel: string;
      readonly name: string;
      readonly id: string;
    }>();
    expectTypeOf<RealtimeBroadcast["message"]>().toEqualTypeOf<RealtimeMessage>();
    expectTypeOf<RealtimeBroadcast["permission"]>().toEqualTypeOf<string>();
    expectTypeOf<RealtimeSession["realm"]>().toEqualTypeOf<Realm | undefined>();
    expectTypeOf<RealtimeSession["permissions"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<RealtimeTarget>().toEqualTypeOf<{
      readonly origin: string;
      readonly token: string;
    }>();
    expectTypeOf<RealtimeLink["close"]>().toEqualTypeOf<() => void>();
    expectTypeOf<
      Parameters<RealtimeLinkHandlers["onMessage"]>[0]
    >().toEqualTypeOf<RealtimeMessage>();
  });
});
