/**
 * Stackra file contract:
 * Purpose: proves the web TenantMenu names its trigger with the current membership, lists every membership with the
 *          current one checked and the host's line under each, switches the container's `TenantSwitcher` to the
 *          chosen one and reports it, reports the current one without switching, shows the host's `failed` words
 *          when a switch is refused, renders nothing with no active membership, and keeps names in their own
 *          direction and the layout logical in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui components and a real `TenantSwitcher` in a container; the
 *           Arabic case renders under `dir="rtl"`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0208; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { ActiveScopeService } from "@stackra/scope";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { TenantSwitcher } from "#core/index";
import type { TenantMembership } from "#core/types/tenant-membership.type";
import { TenantMenu } from "#react/tenant-menu/tenant-menu";

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

const LABELS = {
  trigger: "Switch organisation",
  switching: "Switching…",
  failed: "Couldn't switch organisation.",
};

/** A switcher holding `memberships` and a wrapper that binds it. */
async function setUp(memberships: readonly TenantMembership[] = [ALPHA, BETA]) {
  const switcher = new TenantSwitcher(new ActiveScopeService());
  switcher.setMemberships(memberships);
  const container = await Container.create([], {
    overrides: new Map([[TenantSwitcher, switcher]]),
  });
  const wrap = (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
  return { switcher, wrap };
}

/** Opens the menu and returns the item named `name`. */
async function itemNamed(name: RegExp) {
  fireEvent.click(screen.getByRole("button", { name: /Switch organisation/ }));
  return screen.findByRole("menuitemradio", { name });
}

describe("TenantMenu (web)", () => {
  beforeAll(() => {
    // jsdom has no layout; the menu scrolls its focused item into view (as in the Dropdown test).
    Object.defineProperty(Element.prototype, "scrollTo", {
      value: () => undefined,
      configurable: true,
    });
  });
  afterAll(() => {
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  });
  afterEach(cleanup);

  it("lists the memberships with the current one checked and the host's line", async () => {
    const { wrap } = await setUp();
    render(wrap(<TenantMenu labels={LABELS} describe={(m) => `Role ${m.role}`} />));
    expect(screen.getByRole("button", { name: "Switch organisation: Alpha" })).toBeTruthy();
    const alpha = await itemNamed(/Alpha/);
    expect(alpha.getAttribute("aria-checked")).toBe("true");
    expect(alpha.textContent).toContain("Role admin");
    const beta = screen.getByRole("menuitemradio", { name: /Beta/ });
    expect(beta.getAttribute("aria-checked")).toBe("false");
    // React Aria names the menu by its trigger.
    expect(screen.getByRole("menu", { name: "Switch organisation: Alpha" })).toBeTruthy();
  });

  it("switches to the chosen membership and reports it", async () => {
    const { switcher, wrap } = await setUp();
    const onSwitched = vi.fn();
    render(wrap(<TenantMenu labels={LABELS} onSwitched={onSwitched} />));
    const beta = await itemNamed(/Beta/);
    await act(async () => {
      fireEvent.click(beta);
    });
    await waitFor(() => expect(onSwitched).toHaveBeenCalledWith(BETA.tenantId));
    expect(switcher.current()?.tenantId).toBe(BETA.tenantId);
    expect(screen.getByRole("button", { name: "Switch organisation: Beta" })).toBeTruthy();
  });

  it("reports the current membership without switching", async () => {
    const { switcher, wrap } = await setUp();
    const spy = vi.spyOn(switcher, "switchTo");
    const onSwitched = vi.fn();
    render(wrap(<TenantMenu labels={LABELS} onSwitched={onSwitched} />));
    fireEvent.click(await itemNamed(/Alpha/));
    await waitFor(() => expect(onSwitched).toHaveBeenCalledWith(ALPHA.tenantId));
    expect(spy).not.toHaveBeenCalled();
  });

  it("shows the host's words when a switch fails", async () => {
    const { switcher, wrap } = await setUp();
    vi.spyOn(switcher, "switchTo").mockRejectedValue(new Error("refused"));
    const onSwitched = vi.fn();
    render(wrap(<TenantMenu labels={LABELS} onSwitched={onSwitched} />));
    fireEvent.click(await itemNamed(/Beta/));
    expect((await screen.findByRole("alert")).textContent).toBe(LABELS.failed);
    expect(onSwitched).not.toHaveBeenCalled();
    expect(switcher.current()?.tenantId).toBe(ALPHA.tenantId);
  });

  it("renders nothing with no active membership", async () => {
    const { wrap } = await setUp([]);
    const { container } = render(wrap(<TenantMenu labels={LABELS} />));
    expect(container.textContent).toBe("");
  });

  it("keeps a name in its own direction and the layout logical in Arabic", async () => {
    const { wrap } = await setUp([{ ...ALPHA, name: "أكاديمية ألفا" }, BETA]);
    render(wrap(<TenantMenu labels={LABELS} />, "rtl"));
    const trigger = screen.getByRole("button", { name: /أكاديمية ألفا/ });
    expect(trigger.querySelector("[dir='auto']")?.textContent).toBe("أكاديمية ألفا");
    expect(trigger.className).toMatch(/\btext-start\b/);
    expect(trigger.className).not.toMatch(/\b(text-left|text-right|ml-|mr-|pl-|pr-)/);
  });
});
