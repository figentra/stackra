/**
 * Stackra file contract:
 * Purpose: proves `EntitlementGate` shows its children while the plan grants the entitlement and its fallback while it
 *          does not, shows nothing while the answer is pending, reads an unreachable source as not granted, asks the
 *          scope it is given, draws no element of its own (so a shown control keeps its role and its place in the tab
 *          order) and keeps a shown Arabic subtree in its direction.
 * Boundary: unit tier, jsdom, `fakeEntitlements` (or a hand-made source) bound in a real container; the Arabic case
 *           renders under `dir="rtl"`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0215 (decisions 1 and 3); ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { PublicId } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { EntitlementSource } from "#core/index";
import { EntitlementGate } from "#react/entitlement-gate/entitlement-gate";
import { fakeEntitlements } from "#testing/index";

/** A container that binds `source`, and a wrapper that provides it. */
async function setUp(source: EntitlementSource) {
  const container = await Container.create([], {
    overrides: new Map([[EntitlementSource, source]]),
  });
  return (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
}

/** A source whose every answer comes from `grant`. */
const sourceOf = (grant: EntitlementSource["grant"]): EntitlementSource =>
  Object.assign(Object.create(EntitlementSource.prototype) as EntitlementSource, { grant });

const EXPORT = <button type="button">Export invoices</button>;
const UPGRADE = <p>Upgrade to export</p>;

describe("EntitlementGate", () => {
  afterEach(cleanup);

  it("shows the children while the plan grants the entitlement", async () => {
    const wrap = await setUp(fakeEntitlements([["billing", true]]));
    render(
      wrap(
        <EntitlementGate feature="billing" fallback={UPGRADE}>
          {EXPORT}
        </EntitlementGate>,
      ),
    );
    expect(await screen.findByRole("button", { name: "Export invoices" })).toBeTruthy();
    expect(screen.queryByText("Upgrade to export")).toBeNull();
  });

  it("shows the fallback while the plan does not grant it, and nothing without one", async () => {
    const wrap = await setUp(fakeEntitlements([["billing", false]]));
    const { container, rerender } = render(
      wrap(
        <EntitlementGate feature="billing" fallback={UPGRADE}>
          {EXPORT}
        </EntitlementGate>,
      ),
    );
    expect(await screen.findByText("Upgrade to export")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    rerender(wrap(<EntitlementGate feature="reports">{EXPORT}</EntitlementGate>));
    await act(async () => {});
    expect(container.textContent).toBe("");
  });

  it("shows nothing while the answer is pending", async () => {
    let answer: ((granted: boolean) => void) | undefined;
    const wrap = await setUp(
      sourceOf(
        () =>
          new Promise<boolean>((resolve) => {
            answer = resolve;
          }),
      ),
    );
    const { container } = render(
      wrap(
        <EntitlementGate feature="billing" fallback={UPGRADE}>
          {EXPORT}
        </EntitlementGate>,
      ),
    );
    expect(container.textContent).toBe("");
    await act(async () => answer?.(true));
    expect(screen.getByRole("button", { name: "Export invoices" })).toBeTruthy();
  });

  it("reads a source that cannot be reached as not granted", async () => {
    const wrap = await setUp(sourceOf(() => Promise.reject(new Error("plan service down"))));
    render(
      wrap(
        <EntitlementGate feature="billing" fallback={UPGRADE}>
          {EXPORT}
        </EntitlementGate>,
      ),
    );
    expect(await screen.findByText("Upgrade to export")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("asks the plan of the scope it is given", async () => {
    const scope = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1" as PublicId;
    const grant = vi.fn(() => Promise.resolve(true));
    const wrap = await setUp(sourceOf(grant));
    render(
      wrap(
        <EntitlementGate feature="billing" scope={scope}>
          {EXPORT}
        </EntitlementGate>,
      ),
    );
    await screen.findByRole("button", { name: "Export invoices" });
    expect(grant).toHaveBeenCalledWith("billing", scope);
  });

  it("draws no element of its own, so the control stays keyboard reachable", async () => {
    const wrap = await setUp(fakeEntitlements([["billing", true]]));
    const { container } = render(
      wrap(<EntitlementGate feature="billing">{EXPORT}</EntitlementGate>),
    );
    const button = await screen.findByRole("button", { name: "Export invoices" });
    expect(button.parentElement).toBe(container.firstElementChild);
    act(() => button.focus());
    expect(document.activeElement).toBe(button);
  });

  it("keeps a shown Arabic subtree in its direction", async () => {
    const wrap = await setUp(fakeEntitlements([["billing", true]]));
    render(
      wrap(
        <EntitlementGate feature="billing">
          <button type="button">تصدير الفواتير</button>
        </EntitlementGate>,
        "rtl",
      ),
    );
    const button = await screen.findByRole("button", { name: "تصدير الفواتير" });
    expect(button.closest("[dir]")?.getAttribute("dir")).toBe("rtl");
  });
});
