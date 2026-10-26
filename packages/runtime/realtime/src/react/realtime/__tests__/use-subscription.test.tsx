/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useSubscription(Event, listener)`: the listener runs on its event's refresh and not
 *          on another's, the newest inline listener runs without resubscribing, nothing runs after unmount, a server
 *          render subscribes nothing, and the template's call shape type-checks.
 * Boundary: test only; jsdom with Testing Library's `renderHook`; the connection is the fake, bound as an override.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (broadcast); ADR 0295 (decision 10).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { RealtimeConnection } from "#core/index";
import { useSubscription } from "#react/realtime/use-subscription";
import { RealtimeFake } from "#testing/realtime.fake";

/** Generated-style event refs. */
class OrderPaid {
  static readonly eventName = "orders.order.paid.v1";

  orderId!: string;
}

class InboxMessageCreated {
  static readonly eventName = "messages.inbox_message.created.v1";

  inboxMessageId!: string;
}

/** A provider over a container that binds `connection` as the `RealtimeConnection`. */
async function wrapperFor(connection: RealtimeConnection) {
  const container = await Container.create([], {
    overrides: new Map([[RealtimeConnection, connection]]),
  });
  return function Wrapper({ children }: { readonly children?: ReactNode }) {
    return <ContainerProvider container={container}>{children}</ContainerProvider>;
  };
}

describe("useSubscription", () => {
  it("calls the listener on its event's refresh only", async () => {
    const fake = new RealtimeFake();
    const refetch = vi.fn(() => Promise.resolve());
    renderHook(() => useSubscription(OrderPaid, () => refetch()), {
      wrapper: await wrapperFor(fake),
    });
    act(() => fake.emit(OrderPaid, { orderId: "ord_1" }));
    act(() => fake.emit(InboxMessageCreated));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("calls the newest listener and stops after unmount", async () => {
    const fake = new RealtimeFake();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ listener }) => useSubscription(OrderPaid, listener),
      {
        wrapper: await wrapperFor(fake),
        initialProps: { listener: first },
      },
    );
    rerender({ listener: second });
    act(() => fake.emit(OrderPaid));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(expect.objectContaining({ name: "orders.order.paid.v1" }));
    unmount();
    act(() => fake.emit(OrderPaid));
    expect(second).toHaveBeenCalledOnce();
  });

  it("subscribes nothing during a server render", async () => {
    const fake = new RealtimeFake();
    const listener = vi.fn();
    const Wrapper = await wrapperFor(fake);
    function Inbox() {
      useSubscription(InboxMessageCreated, listener);
      return null;
    }
    renderToString(
      <Wrapper>
        <Inbox />
      </Wrapper>,
    );
    fake.emit(InboxMessageCreated);
    expect(listener).not.toHaveBeenCalled();
  });
});
