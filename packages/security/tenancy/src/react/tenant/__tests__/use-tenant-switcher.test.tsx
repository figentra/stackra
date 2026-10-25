// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useTenantSwitcher()`: it lists the memberships of the `TenantSwitcher` the nearest
 *          container binds, re-renders when they change, hands out the switcher's own `switchTo` (which moves the
 *          active tenant and refuses a tenant the user is not a member of), and throws when the container does not
 *          bind the switcher.
 * Boundary: test only; jsdom with React Testing Library.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0208; ADR 0327 (decision 10).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { isRefusal } from "@stackra/errors";
import { ActiveScopeService } from "@stackra/scope";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { TenantMembershipMissingError, TenantSwitcher } from "#core/index";
import type { TenantMembership } from "#core/types/tenant-membership.type";
import { useTenantSwitcher } from "#react/tenant/use-tenant-switcher";

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
const GAMMA = "scp_01j9z3k4m5n6p7q8r9s0t1v2wc";

/** Calls the hook. */
function Probe() {
  useTenantSwitcher();
  return null;
}

/** A switcher, a scope it moves and a provider that binds the switcher. */
async function setUp() {
  const scope = new ActiveScopeService();
  const switcher = new TenantSwitcher(scope);
  const container = await Container.create([], {
    overrides: new Map([[TenantSwitcher, switcher]]),
  });
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
  return { scope, switcher, wrapper };
}

describe("useTenantSwitcher", () => {
  it("lists the memberships and re-renders when they change", async () => {
    const { switcher, wrapper } = await setUp();
    const { result } = renderHook(() => useTenantSwitcher(), { wrapper });
    expect(result.current.memberships).toEqual([]);
    act(() => switcher.setMemberships([ALPHA, BETA]));
    expect(result.current.memberships).toEqual([ALPHA, BETA]);
  });

  it("switches through the switcher's own switchTo and refuses a stranger's tenant", async () => {
    const { scope, switcher, wrapper } = await setUp();
    switcher.setMemberships([ALPHA, BETA]);
    const { result } = renderHook(() => useTenantSwitcher(), { wrapper });
    expect(result.current.switchTo).toBe(switcher.switchTo);
    await act(() => result.current.switchTo(BETA.tenantId));
    expect(switcher.current()).toBe(BETA);
    expect(scope.current()?.path).toBe(BETA.path);
    const refused = await result.current.switchTo(GAMMA).catch((error: unknown) => error);
    expect(isRefusal(refused, TenantMembershipMissingError)).toBe(true);
  });

  it("throws when the container does not bind the switcher", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <Probe />
        </ContainerProvider>,
      ),
    ).toThrow(/TenantSwitcher/);
  });

  it("types the memberships and the switch", () => {
    expectTypeOf(useTenantSwitcher).returns.toEqualTypeOf<{
      readonly memberships: readonly TenantMembership[];
      readonly switchTo: (tenantId: string) => Promise<void>;
    }>();
  });
});
