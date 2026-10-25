// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useCursors(room)`: only peers with a cursor are listed, the move function shows this
 *          client's cursor to the other peer and hides it with `null`, and it stays the same function across renders.
 * Boundary: test only; jsdom with Testing Library; the session runs on this package's memory drivers with a
 *           `fakeEntitlements` grant.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 2: cursors); ADR 0270 (decision 6).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { PublicId } from "@stackra/contracts";
import { fakeEntitlements } from "@stackra/entitlements/testing";
import { RealtimeStatus } from "@stackra/realtime";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { CollaborationConfig } from "#config/collaboration.config";
import type { CollaborationCursor, CollaborationRoom, PresencePeer } from "#contracts/index";
import { CollaborationSession, LiveCollaborationEntitlement } from "#core/index";
import { useCursors } from "#react/cursors/use-cursors";
import { MemoryPresenceChannelDriver, MemorySyncTransportDriver } from "#testing/index";

const ROOM: CollaborationRoom = { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" };
const BOB: PublicId = "usr_01j9z3k4m5n6p7q8r9s0t1v2wb";

describe("useCursors", () => {
  it("lists the peers with a cursor and moves this client's", async () => {
    const config = buildConfig(CollaborationConfig);
    const source = fakeEntitlements([[LiveCollaborationEntitlement, true]]);
    const presence = new MemoryPresenceChannelDriver();
    const sync = new MemorySyncTransportDriver();
    const viewer = new CollaborationSession(config, presence, sync, source);
    const bob = new CollaborationSession(config, presence.peer(BOB), sync.peer(), source);
    bob.join(ROOM);
    const container = await Container.create([], {
      overrides: new Map([[CollaborationSession, viewer]]),
    });
    const { result, rerender } = renderHook(() => useCursors({ ...ROOM }), {
      wrapper: ({ children }: { readonly children?: ReactNode }) => (
        <ContainerProvider container={container}>{children}</ContainerProvider>
      ),
    });
    await waitFor(() => expect(viewer.state(ROOM)?.status).toBe(RealtimeStatus.Connected));
    expect(result.current[0]).toEqual([]);
    act(() => bob.moveCursor(ROOM, { x: 4, y: 2 }));
    expect(result.current[0].map((peer) => [peer.principalId, peer.cursor])).toEqual([
      [BOB, { x: 4, y: 2 }],
    ]);
    const move = result.current[1];
    rerender();
    expect(result.current[1]).toBe(move);
    act(() => move({ x: 7, y: 7 }));
    expect(bob.state(ROOM)?.peers[0]?.cursor).toEqual({ x: 7, y: 7 });
    expectTypeOf(useCursors).returns.toEqualTypeOf<
      readonly [readonly PresencePeer[], (cursor: CollaborationCursor | null) => void]
    >();
  });
});
