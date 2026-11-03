/**
 * Stackra file contract:
 * Purpose: proves the web TenantPicker names its combo box with the host's label, lists the container's memberships
 *          with the host's line under each when no `loadOptions` is given, filters them by name as the user types,
 *          reports the chosen membership keyed by its tenant id, asks the host's `loadOptions` instead when given, and
 *          keeps an Arabic name in its own direction under `dir="rtl"`.
 * Boundary: unit tier, jsdom, the real @stackra/ui EntityPicker and a real `TenantSwitcher` in a container. jsdom has
 *           no IntersectionObserver nor layout, which the list's load-more sentinel and scrolling need, so both get
 *           stand-ins (as in the EntityPicker test).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0208; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { ActiveScopeService } from "@stackra/scope";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { TenantSwitcher } from "#core/index";
import type { TenantMembership } from "#core/types/tenant-membership.type";
import { TenantPicker } from "#react/tenant-picker/tenant-picker";

const ALPHA: TenantMembership = {
  tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa",
  path: "platform.acme.alpha",
  name: "Alpha",
  role: "admin",
  roles: ["admin"],
};
const BETA: TenantMembership = {
  ...ALPHA,
  tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wb",
  path: "platform.acme.beta",
  name: "Beta",
  role: "staff",
  roles: ["staff"],
};

const LABELS = { label: "Organisation", emptyMessage: "No organisation matches" };

/** A container whose switcher holds `memberships`, and a wrapper that binds it. */
async function setUp(memberships: readonly TenantMembership[] = [ALPHA, BETA]) {
  const switcher = new TenantSwitcher(new ActiveScopeService());
  switcher.setMemberships(memberships);
  const container = await Container.create([], {
    overrides: new Map([[TenantSwitcher, switcher]]),
  });
  return (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
}

/** Types into the field the way a person does: focus first, which is what lets the list open. */
const type = (text: string) => {
  const input = screen.getByRole("combobox");
  act(() => input.focus());
  fireEvent.change(input, { target: { value: text } });
};

/** The names of the options the open list shows. */
const optionNames = async () =>
  within(await screen.findByRole("listbox"))
    .queryAllByRole("option")
    .map((option) => option.textContent);

describe("TenantPicker (web)", () => {
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

  it("names the field by the host's label and lists the memberships with the host's line", async () => {
    const wrap = await setUp();
    render(
      wrap(<TenantPicker debounceMs={0} describe={(m) => `Role ${m.role}`} labels={LABELS} />),
    );
    expect(screen.getByRole("combobox", { name: /Organisation/ })).toBeTruthy();
    type("a");
    const names = await optionNames();
    expect(names).toHaveLength(2);
    expect(names[0]).toContain("Alpha");
    expect(names[0]).toContain("Role admin");
  });

  it("filters the memberships by name, ignoring case", async () => {
    const wrap = await setUp();
    render(wrap(<TenantPicker debounceMs={0} labels={LABELS} />));
    type("BET");
    expect(await screen.findByRole("option", { name: /Beta/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /Alpha/ })).toBeNull();
  });

  it("reports the chosen membership keyed by its tenant id", async () => {
    const wrap = await setUp();
    const onChange = vi.fn();
    render(wrap(<TenantPicker debounceMs={0} onChange={onChange} labels={LABELS} />));
    type("Beta");
    const beta = await screen.findByRole("option", { name: /Beta/ });
    act(() => beta.click());
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: BETA.tenantId, label: "Beta" }),
    );
  });

  it("asks the host's loadOptions when given", async () => {
    const wrap = await setUp();
    const loadOptions = vi.fn(() =>
      Promise.resolve({ items: [{ id: "scp_other", label: "Gamma" }], nextCursor: null }),
    );
    render(wrap(<TenantPicker debounceMs={0} loadOptions={loadOptions} labels={LABELS} />));
    type("Ga");
    expect(await screen.findByRole("option", { name: /Gamma/ })).toBeTruthy();
    expect(loadOptions).toHaveBeenCalledWith("Ga", undefined);
    expect(screen.queryByRole("option", { name: /Alpha/ })).toBeNull();
  });

  it("keeps an Arabic name in its own direction under right-to-left", async () => {
    const wrap = await setUp([{ ...ALPHA, name: "أكاديمية ألفا" }]);
    render(wrap(<TenantPicker debounceMs={0} labels={{ label: "المؤسسة" }} />, "rtl"));
    expect(screen.getByRole("combobox", { name: /المؤسسة/ })).toBeTruthy();
    type("ألفا");
    expect(await screen.findByRole("option", { name: /أكاديمية ألفا/ })).toBeTruthy();
    expect(screen.getByRole("combobox").closest("[dir='rtl']")).toBeTruthy();
  });
});
