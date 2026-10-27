/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useRealtimeConnection()`: `null` while signed out, the status while signed in,
 *          a re-render on each status change, the server render, and the throws outside a provider and when the
 *          container does not bind `RealtimeConnection`.
 * Boundary: test only; jsdom with Testing Library's `renderHook`; the connection is the fake, bound as an override.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225; ADR 0295 (decision 10).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { RealtimeConnection, RealtimeStatus } from "#core/index";
import type { RealtimeConnectionState } from "#core/index";
import { useRealtimeConnection } from "#react/realtime/use-realtime-connection";
import { fakeRealtime } from "#testing/functions/fake-realtime.function";
import { RealtimeFake } from "#testing/realtime.fake";

/** A provider over a container that binds `connection` as the `RealtimeConnection`. */
async function wrapperFor(connection: RealtimeConnection) {
  const container = await Container.create([], {
    overrides: new Map([[RealtimeConnection, connection]]),
  });
  return function Wrapper({ children }: { readonly children?: ReactNode }) {
    return <ContainerProvider container={container}>{children}</ContainerProvider>;
  };
}

/** Renders the status as text. */
function Status() {
  return <span>{useRealtimeConnection()?.status ?? "signed_out"}</span>;
}

describe("useRealtimeConnection", () => {
  it("returns the status and re-renders when it changes", async () => {
    const fake = new RealtimeFake();
    const { result } = renderHook(() => useRealtimeConnection(), {
      wrapper: await wrapperFor(fake),
    });
    expect(result.current).toEqual({ status: RealtimeStatus.Connected });
    act(() => fake.setStatus(RealtimeStatus.Disconnected));
    expect(result.current).toEqual({ status: RealtimeStatus.Disconnected });
    act(() => fake.stop());
    expect(result.current).toBeNull();
    expectTypeOf(useRealtimeConnection).returns.toEqualTypeOf<RealtimeConnectionState | null>();
  });

  it("renders on the server from the same snapshot", async () => {
    const Wrapper = await wrapperFor(fakeRealtime({ status: RealtimeStatus.Connecting }));
    expect(
      renderToString(
        <Wrapper>
          <Status />
        </Wrapper>,
      ),
    ).toBe("<span>connecting</span>");
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<Status />)).toThrow(/ContainerProvider/);
  });

  it("throws when the container does not bind RealtimeConnection", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <Status />
        </ContainerProvider>,
      ),
    ).toThrow(/RealtimeConnection/);
  });
});
