/**
 * Stackra file contract:
 * Purpose: proves the AccountMenu names its trigger with the signed-in user, opens a menu named by it with the host's
 *          groups and a last group headed by the user's address, signs out through the session and then reports it,
 *          runs a host item, renders nothing while signed out, and keeps the name in its own direction and the layout
 *          logical in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui components and a `SessionFake` bound in a real container; the
 *           Arabic case renders under `dir="rtl"`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0206 (decision 8); ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import type { MenuSection } from "@stackra/ui/contracts";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { SessionService, SessionStatus } from "#core/index";
import { AccountMenu } from "#react/account-menu/account-menu";
import { SessionFake } from "#testing/session.fake";

const LABELS = { trigger: "Account menu", signOut: "Sign out" };

/** A fake session in `status` and a wrapper that binds it. */
async function setUp(status: SessionStatus = SessionStatus.SignedIn) {
  const session = new SessionFake().seed({ status });
  const container = await Container.create([], {
    overrides: new Map([[SessionService, session]]),
  });
  const wrap = (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
  return { session, wrap };
}

/** Opens the menu the way a user does. */
async function open() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Account menu: Test User" }));
  });
  return screen.findByRole("menu", { name: "Account menu: Test User" });
}

describe("AccountMenu", () => {
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

  it("opens the host's groups and the sign-out group headed by the address", async () => {
    const { wrap } = await setUp();
    const onPress = vi.fn();
    const sections: readonly MenuSection[] = [
      { id: "me", title: "Me", items: [{ id: "security", label: "Security", onPress }] },
    ];
    render(wrap(<AccountMenu sections={sections} labels={LABELS} />));
    await open();
    expect(screen.getByRole("menuitem", { name: /Security/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Sign out/ })).toBeTruthy();
    expect(screen.getByText("user@example.test")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: /Security/ }));
    });
    expect(onPress).toHaveBeenCalled();
  });

  it("signs out through the session and reports it", async () => {
    const { session, wrap } = await setUp();
    const onSignOut = vi.fn();
    render(wrap(<AccountMenu onSignOut={onSignOut} labels={LABELS} />));
    await open();
    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: /Sign out/ }));
    });
    await waitFor(() => expect(onSignOut).toHaveBeenCalled());
    expect(session.signOut).toHaveBeenCalled();
  });

  it("reports the sign-out even when the provider cannot be reached", async () => {
    const { session, wrap } = await setUp();
    vi.mocked(session.signOut).mockRejectedValue(new Error("offline"));
    const onSignOut = vi.fn();
    render(wrap(<AccountMenu onSignOut={onSignOut} labels={LABELS} />));
    await open();
    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: /Sign out/ }));
    });
    await waitFor(() => expect(onSignOut).toHaveBeenCalled());
  });

  it("renders nothing while signed out", async () => {
    const { wrap } = await setUp(SessionStatus.SignedOut);
    const { container } = render(wrap(<AccountMenu labels={LABELS} />));
    expect(container.textContent).toBe("");
  });

  it("keeps the name in its own direction and the layout logical in Arabic", async () => {
    const { wrap } = await setUp();
    render(wrap(<AccountMenu labels={LABELS} />, "rtl"));
    const trigger = screen.getByRole("button", { name: /Test User/ });
    expect(trigger.querySelector("[dir='auto']")?.textContent).toBe("Test User");
    expect(trigger.className).toMatch(/\btext-start\b/);
    expect(trigger.className).not.toMatch(/\b(text-left|text-right|ml-|mr-|pl-|pr-)/);
  });
});
