/**
 * Stackra file contract:
 * Purpose: proves the web ScopePicker names its field with the host's label and shows the active scope, lists the
 *          scopes as a tree nested by path up to `searchThreshold` (8 by default) and makes a chosen row the active
 *          scope, becomes a search field above it that filters by name and switches on a choice, follows a change of
 *          the active scope made elsewhere, and keeps an Arabic name in its own direction under `dir="rtl"`.
 * Boundary: unit tier, jsdom, the real @stackra/ui TreeSelect and EntityPicker and a real `ActiveScopeService` in a
 *           container. jsdom has no IntersectionObserver nor layout, which the search list's load-more sentinel and
 *           scrolling need, so both get stand-ins (as in the EntityPicker test).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0327 (decision 10); ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import type { ScopeEntry } from "#contracts/types/scope-entry.type";
import { ActiveScopeService } from "#core/index";
import { ScopePicker } from "#react/scope-picker/scope-picker";

const ACME: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa",
  path: "platform.acme",
  level: "product",
  name: "Acme",
};
const NORTH: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2wb",
  path: "platform.acme.north",
  level: "branch",
  name: "North branch",
};
const SOUTH: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2wc",
  path: "platform.acme.south",
  level: "branch",
  name: "South branch",
};

/** `count` sibling scopes under Acme, named "Store 1" and on. */
const stores = (count: number): ScopeEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `scp_01j9z3k4m5n6p7q8r9s0t1v${String(index).padStart(3, "0")}`,
    path: `platform.acme.store_${index + 1}`,
    level: "branch",
    name: `Store ${index + 1}`,
  }));

const LABELS = { label: "Scope", placeholder: "Choose a scope", emptyMessage: "No scope matches" };

/** A service, a container that binds it, and a wrapper that provides it. */
async function setUp() {
  const service = new ActiveScopeService();
  const container = await Container.create([], {
    overrides: new Map([[ActiveScopeService, service]]),
  });
  const wrap = (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
  return { service, wrap };
}

describe("ScopePicker (web)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
    Object.defineProperty(Element.prototype, "scrollTo", {
      value: () => undefined,
      configurable: true,
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  });

  it("names the field by the host's label and shows the active scope", async () => {
    const { service, wrap } = await setUp();
    render(wrap(<ScopePicker scopes={[ACME, NORTH, SOUTH]} labels={LABELS} />));
    expect(screen.getByRole("button", { name: "Scope Choose a scope" })).toBeTruthy();
    act(() => service.set({ id: NORTH.id, path: NORTH.path }));
    expect(screen.getByRole("button", { name: "Scope North branch" })).toBeTruthy();
  });

  it("lists the scopes as a tree nested by path and makes a chosen row the active scope", async () => {
    const { service, wrap } = await setUp();
    render(wrap(<ScopePicker scopes={[ACME, NORTH, SOUTH]} labels={LABELS} />));
    act(() => screen.getByRole("button", { name: /Scope/ }).click());
    expect(screen.getByRole("treegrid")).toBeTruthy();
    const south = screen.getByRole("row", { name: /South branch/ });
    expect(south.getAttribute("aria-level")).toBe("2");
    act(() => screen.getByText("South branch").click());
    expect(service.current()).toEqual({ id: SOUTH.id, path: SOUTH.path });
    expect(screen.queryByRole("treegrid")).toBeNull();
  });

  it("is a tree up to the threshold and a search field above it", async () => {
    const { wrap } = await setUp();
    const { rerender } = render(wrap(<ScopePicker scopes={stores(8)} labels={LABELS} />));
    expect(screen.queryByRole("combobox")).toBeNull();
    rerender(wrap(<ScopePicker scopes={stores(9)} labels={LABELS} />));
    expect(screen.getByRole("combobox", { name: /Scope/ })).toBeTruthy();
    rerender(wrap(<ScopePicker scopes={stores(3)} searchThreshold={2} labels={LABELS} />));
    expect(screen.getByRole("combobox", { name: /Scope/ })).toBeTruthy();
  });

  it("searches by name above the threshold and switches on a choice", async () => {
    const { service, wrap } = await setUp();
    render(wrap(<ScopePicker scopes={[ACME, ...stores(9)]} labels={LABELS} />));
    const input = screen.getByRole("combobox", { name: /Scope/ });
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "store 9" } });
    // The picker lists every scope when it opens and searches after its debounce, so wait for the narrowed list.
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    const option = screen.getByRole("option", { name: /Store 9/ });
    expect(option.textContent).toContain("Acme");
    act(() => option.click());
    expect(service.current()?.path).toBe("platform.acme.store_9");
  });

  it("keeps an Arabic name in its own direction under right-to-left", async () => {
    const { service, wrap } = await setUp();
    service.set({ id: ACME.id, path: ACME.path });
    render(
      wrap(
        <ScopePicker scopes={[{ ...ACME, name: "أكاديمية أكمي" }]} labels={{ label: "النطاق" }} />,
        "rtl",
      ),
    );
    const trigger = screen.getByRole("button", { name: "النطاق أكاديمية أكمي" });
    expect(trigger.closest("[dir='rtl']")).toBeTruthy();
  });
});
