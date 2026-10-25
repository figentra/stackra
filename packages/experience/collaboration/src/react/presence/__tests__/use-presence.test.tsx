// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `usePresence(room)`: `null` on the server, the room's state while mounted with the
 *          other principal in it, the room left on unmount, the plan's refusal thrown to the nearest error boundary,
 *          and the throw outside a provider.
 * Boundary: test only; jsdom with Testing Library; the session runs on this package's memory drivers with a
 *           `fakeEntitlements` grant.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 2); ADR 0270 (decision 5).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { PublicId } from "@stackra/contracts";
import type { EntitlementSource } from "@stackra/entitlements";
import { fakeEntitlements } from "@stackra/entitlements/testing";
import { EntitlementRequiredError } from "@stackra/errors";
import { RealtimeStatus } from "@stackra/realtime";
import { afterEach, describe, expect, expectTypeOf, it } from "@stackra/testing";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { Component, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { vi } from "vitest";

import { CollaborationConfig } from "#config/collaboration.config";
import type { CollaborationRoom } from "#contracts/index";
import { CollaborationSession, LiveCollaborationEntitlement } from "#core/index";
import type { CollaborationRoomState } from "#core/index";
import { usePresence } from "#react/presence/use-presence";
import { MemoryPresenceChannelDriver, MemorySyncTransportDriver } from "#testing/index";

const ROOM: CollaborationRoom = { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" };
const BOB: PublicId = "usr_01j9z3k4m5n6p7q8r9s0t1v2wb";

/** A session for the viewer and one for Bob on the same rooms. */
function sessions(
  source: EntitlementSource = fakeEntitlements([[LiveCollaborationEntitlement, true]]),
) {
  const config = buildConfig(CollaborationConfig);
  const presence = new MemoryPresenceChannelDriver();
  const sync = new MemorySyncTransportDriver();
  return {
    viewer: new CollaborationSession(config, presence, sync, source),
    bob: new CollaborationSession(config, presence.peer(BOB), sync.peer(), source),
  };
}

/** A provider over a container that binds `session`. */
async function wrapperFor(session: CollaborationSession) {
  const container = await Container.create([], {
    overrides: new Map([[CollaborationSession, session]]),
  });
  return function Wrapper({ children }: { readonly children?: ReactNode }) {
    return <ContainerProvider container={container}>{children}</ContainerProvider>;
  };
}

/** Shows `upgrade` for an entitlement refusal. */
class Boundary extends Component<{ readonly children?: ReactNode }, { readonly error?: unknown }> {
  override state: { readonly error?: unknown } = {};

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  override render() {
    return this.state.error instanceof EntitlementRequiredError ? (
      <span>upgrade</span>
    ) : (
      this.props.children
    );
  }
}

/** Renders the status as text. */
function Status() {
  return <span>{usePresence(ROOM)?.status ?? "idle"}</span>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePresence", () => {
  it("joins while mounted, shows the other peers and leaves on unmount", async () => {
    const { viewer, bob } = sessions();
    bob.join(ROOM);
    const { result, unmount } = renderHook(() => usePresence({ ...ROOM }), {
      wrapper: await wrapperFor(viewer),
    });
    await waitFor(() => expect(result.current?.status).toBe(RealtimeStatus.Connected));
    expect(result.current?.peers.map((peer) => peer.principalId)).toEqual([BOB]);
    unmount();
    expect(viewer.state(ROOM)).toBeNull();
    await waitFor(() => expect(bob.state(ROOM)?.peers).toEqual([]));
    expectTypeOf(usePresence).returns.toEqualTypeOf<CollaborationRoomState | null>();
  });

  it("renders null on the server and joins nothing", async () => {
    const { viewer } = sessions();
    const Wrapper = await wrapperFor(viewer);
    expect(
      renderToString(
        <Wrapper>
          <Status />
        </Wrapper>,
      ),
    ).toBe("<span>idle</span>");
    expect(viewer.state(ROOM)).toBeNull();
  });

  it("throws the plan's refusal to the nearest error boundary", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { viewer } = sessions(fakeEntitlements());
    const Wrapper = await wrapperFor(viewer);
    render(
      <Wrapper>
        <Boundary>
          <Status />
        </Boundary>
      </Wrapper>,
    );
    expect(await screen.findByText("upgrade")).toBeTruthy();
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<Status />)).toThrow(/ContainerProvider/);
  });
});
