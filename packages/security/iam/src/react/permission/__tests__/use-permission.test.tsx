// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `usePermission()`: a render reads the `PermissionSnapshotService` the nearest
 *          container binds and re-renders when the snapshot changes; a server render reads the same state; it throws
 *          outside a `ContainerProvider` and when the container does not bind the service.
 * Boundary: test only; jsdom with React Testing Library for the client, react-dom/server for the server render.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0208 (decision 6); ADR 0295 (decision 10).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { type Permission, PermissionSnapshotService } from "#core/index";
import { usePermission } from "#react/permission/use-permission";

/** Shows whether the session may create orders. */
function NewOrder() {
  const can = usePermission();
  return <output>{can("orders.order.create") ? "shown" : "hidden"}</output>;
}

/** A snapshot and a provider that binds it. */
async function setUp() {
  const snapshot = new PermissionSnapshotService();
  const container = await Container.create([], {
    overrides: new Map([[PermissionSnapshotService, snapshot]]),
  });
  const wrap = (children: ReactNode) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
  return { snapshot, wrap };
}

describe("usePermission", () => {
  it("reads the snapshot and re-renders on a change", async () => {
    const { snapshot, wrap } = await setUp();
    render(wrap(<NewOrder />));
    expect(screen.getByRole("status").textContent).toBe("hidden");
    act(() => snapshot.set(["orders.*"]));
    expect(screen.getByRole("status").textContent).toBe("shown");
    act(() => snapshot.set([]));
    expect(screen.getByRole("status").textContent).toBe("hidden");
  });

  it("renders the same state on the server", async () => {
    const { snapshot, wrap } = await setUp();
    snapshot.set(["orders.order.create"]);
    expect(renderToString(wrap(<NewOrder />))).toContain("shown");
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<NewOrder />)).toThrow(/ContainerProvider/);
  });

  it("throws when the container does not bind the service", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <NewOrder />
        </ContainerProvider>,
      ),
    ).toThrow();
  });

  it("returns a can function over a static or a key", () => {
    expectTypeOf(usePermission).returns.toEqualTypeOf<
      (permission: Permission | string) => boolean
    >();
  });
});
