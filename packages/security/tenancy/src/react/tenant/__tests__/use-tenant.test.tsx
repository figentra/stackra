// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useTenant()`: it reads the `TenantSwitcher` the nearest container binds and
 *          re-renders on a switch; `{ optional: true }` gives `null` with no tenant, while the bare call refuses
 *          `tenant_required`; a server render shows the switcher's own state; it throws when the container does not
 *          bind the switcher.
 * Boundary: test only; jsdom with React Testing Library for the client, react-dom/server for the server render.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0210 (decision 3); ADR 0295 (decision 10).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { ActiveScopeService } from "@stackra/scope";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { TenantRequiredError, TenantSwitcher } from "#core/index";
import type { TenantMembership } from "#core/types/tenant-membership.type";
import { useTenant } from "#react/tenant/use-tenant";

const ALPHA: TenantMembership = {
  tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa",
  path: "platform.acme.alpha",
  name: "Alpha",
  role: "staff",
  roles: ["staff"],
};
const BETA: TenantMembership = {
  ...ALPHA,
  tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wb",
  name: "Beta",
};

/** Shows the active tenant's name, or "none". */
function OptionalName() {
  const tenant = useTenant({ optional: true });
  return <output>{tenant?.name ?? "none"}</output>;
}

/** Shows the active tenant's name; needs one. */
function RequiredName() {
  return <output>{useTenant().name}</output>;
}

/** The bare overload, never called: its return type is checked at compile time. */
const useRequired = () => useTenant();

/** The optional overload, never called: its return type is checked at compile time. */
const useOptional = () => useTenant({ optional: true });

/** A switcher and a provider that binds it. */
async function setUp() {
  const switcher = new TenantSwitcher(new ActiveScopeService());
  const container = await Container.create([], {
    overrides: new Map([[TenantSwitcher, switcher]]),
  });
  const wrap = (children: ReactNode) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
  return { switcher, wrap };
}

describe("useTenant", () => {
  it("reads the switcher and re-renders on a switch", async () => {
    const { switcher, wrap } = await setUp();
    render(wrap(<OptionalName />));
    expect(screen.getByRole("status").textContent).toBe("none");
    act(() => switcher.setMemberships([ALPHA, BETA]));
    expect(screen.getByRole("status").textContent).toBe("Alpha");
    await act(() => switcher.switchTo(BETA.tenantId));
    expect(screen.getByRole("status").textContent).toBe("Beta");
  });

  it("refuses tenant_required without optional when no tenant is active", async () => {
    const { switcher, wrap } = await setUp();
    expect(() => renderToString(wrap(<RequiredName />))).toThrow(TenantRequiredError);
    switcher.setMemberships([ALPHA]);
    expect(renderToString(wrap(<RequiredName />))).toContain("Alpha");
  });

  it("throws when the container does not bind the switcher", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <OptionalName />
        </ContainerProvider>,
      ),
    ).toThrow(/TenantSwitcher/);
  });

  it("types the bare call as a membership and the optional one as a membership or null", () => {
    expectTypeOf(useRequired).returns.toEqualTypeOf<TenantMembership>();
    expectTypeOf(useOptional).returns.toEqualTypeOf<TenantMembership | null>();
  });
});
