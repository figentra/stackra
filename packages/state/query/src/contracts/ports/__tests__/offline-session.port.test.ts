/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `OfflineSession` port: a keyed port whose driver hands out read-only revoked
 *          and signed-in signals and ends the session on the device.
 * Boundary: test only; the session is a small class of the port.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decision 4).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { OfflineSession } from "#contracts/ports/offline-session.port";

describe("OfflineSession", () => {
  it("is a keyed port with its two signals and an end", async () => {
    let ended = 0;
    class FixedSession extends OfflineSession {
      readonly isRevoked = { get: () => false, subscribe: () => () => undefined };

      readonly isSignedIn = { get: () => true, subscribe: () => () => undefined };

      end(): Promise<void> {
        ended += 1;
        return Promise.resolve();
      }
    }
    const session = new FixedSession();
    expect(session).toBeInstanceOf(Port);
    expect(session.isRevoked.get()).toBe(false);
    expect(session.isSignedIn.get()).toBe(true);
    await session.end();
    expect(ended).toBe(1);
    expectTypeOf<OfflineSession["~key"]>().toEqualTypeOf<"query.OfflineSession">();
  });
});
