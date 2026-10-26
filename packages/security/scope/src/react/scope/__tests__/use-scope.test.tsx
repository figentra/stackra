/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useScope()`: a client render reads the `ActiveScopeService` the nearest container
 *          binds and re-renders when the active scope changes or is cleared; a server render shows `null` whatever
 *          is active; it throws when the container does not bind the service.
 * Boundary: test only; jsdom with React Testing Library for the client, react-dom/server for the server render.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 10); ADR 0295 (decision 10).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { ActiveScopeService } from "#core/index";
import { useScope } from "#react/scope/use-scope";

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

/** Shows the active scope's path. */
function ScopePath() {
  const scope = useScope();
  return <output>{scope?.path ?? "none"}</output>;
}

/** A service and a provider that binds it. */
async function setUp() {
  const service = new ActiveScopeService();
  const container = await Container.create([], {
    overrides: new Map([[ActiveScopeService, service]]),
  });
  const wrap = (children: ReactNode) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
  return { service, wrap };
}

describe("useScope", () => {
  it("reads the service and re-renders on a change", async () => {
    const { service, wrap } = await setUp();
    render(wrap(<ScopePath />));
    expect(screen.getByRole("status").textContent).toBe("none");
    act(() => service.set(ACME));
    expect(screen.getByRole("status").textContent).toBe("platform.acme");
    act(() => service.set(null));
    expect(screen.getByRole("status").textContent).toBe("none");
  });

  it("renders null on the server whatever is active", async () => {
    const { service, wrap } = await setUp();
    service.set(ACME);
    expect(renderToString(wrap(<ScopePath />))).toContain("none");
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<ScopePath />)).toThrow(/ContainerProvider/);
  });

  it("throws when the container does not bind the service", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <ScopePath />
        </ContainerProvider>,
      ),
    ).toThrow(/ActiveScopeService/);
  });

  it("types the scope as a ScopeRef or null", () => {
    expectTypeOf(useScope).returns.toEqualTypeOf<ScopeRef | null>();
  });
});
