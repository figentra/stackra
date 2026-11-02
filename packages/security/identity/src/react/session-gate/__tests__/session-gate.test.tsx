/**
 * Stackra file contract:
 * Purpose: proves the SessionGate shows its children to a signed-in user, the fallback to a signed-out or revoked
 *          visitor, nothing while the session loads, sends a signed-out visitor to `redirectTo`, shows `stepUp` to a
 *          user below the assurance asked for (or whose session names none) and the children at or above it, and keeps
 *          its content's direction in Arabic.
 * Boundary: unit tier, jsdom, a `SessionFake` bound in a real container; `location` is stubbed, so nothing navigates.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0207 (decision 1); ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { AssuranceLevel } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { SessionService, SessionStatus } from "#core/index";
import { SessionGate } from "#react/session-gate/session-gate";
import type { FakeSessionOptions } from "#testing/index";
import { SessionFake } from "#testing/session.fake";

/** A wrapper whose container binds a fake session seeded with `options`. */
async function wrapperFor(options: FakeSessionOptions) {
  const session = new SessionFake().seed(options);
  const container = await Container.create([], {
    overrides: new Map([[SessionService, session]]),
  });
  return (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
}

describe("SessionGate", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the children to a signed-in user", async () => {
    const wrap = await wrapperFor({ status: SessionStatus.SignedIn });
    render(wrap(<SessionGate fallback={<p>Sign in first</p>}>Billing</SessionGate>));
    expect(screen.getByText("Billing")).toBeTruthy();
    expect(screen.queryByText("Sign in first")).toBeNull();
  });

  it("shows the fallback to a signed-out or revoked visitor", async () => {
    for (const status of [SessionStatus.SignedOut, SessionStatus.Revoked]) {
      const wrap = await wrapperFor({ status });
      render(wrap(<SessionGate fallback={<p>Sign in first</p>}>Billing</SessionGate>));
      expect(screen.getByText("Sign in first")).toBeTruthy();
      expect(screen.queryByText("Billing")).toBeNull();
      cleanup();
    }
  });

  it("renders nothing while the session loads", async () => {
    const wrap = await wrapperFor({ status: SessionStatus.Loading });
    const { container } = render(
      wrap(<SessionGate fallback={<p>Sign in first</p>}>Billing</SessionGate>),
    );
    expect(container.textContent).toBe("");
  });

  it("sends a signed-out visitor to the sign-in route", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    const wrap = await wrapperFor({ status: SessionStatus.SignedOut });
    const { container } = render(
      wrap(
        <SessionGate redirectTo="/sign-in" fallback={<p>Sign in first</p>}>
          Billing
        </SessionGate>,
      ),
    );
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/sign-in"));
    expect(container.textContent).toBe("");
  });

  it("asks a user below the assurance to step up", async () => {
    for (const assurance of [undefined, AssuranceLevel.Aal1]) {
      const wrap = await wrapperFor({
        status: SessionStatus.SignedIn,
        ...(assurance === undefined ? {} : { assurance }),
      });
      render(
        wrap(
          <SessionGate assurance={AssuranceLevel.Aal2} stepUp={<p>Verify it's you</p>}>
            API keys
          </SessionGate>,
        ),
      );
      expect(screen.getByText("Verify it's you")).toBeTruthy();
      expect(screen.queryByText("API keys")).toBeNull();
      cleanup();
    }
  });

  it("shows the children at or above the assurance", async () => {
    for (const assurance of [AssuranceLevel.Aal2, AssuranceLevel.Aal3]) {
      const wrap = await wrapperFor({ status: SessionStatus.SignedIn, assurance });
      render(
        wrap(
          <SessionGate assurance={AssuranceLevel.Aal2} stepUp={<p>Verify it's you</p>}>
            API keys
          </SessionGate>,
        ),
      );
      expect(screen.getByText("API keys")).toBeTruthy();
      cleanup();
    }
  });

  it("keeps its content's direction in Arabic", async () => {
    const wrap = await wrapperFor({ status: SessionStatus.SignedIn });
    render(
      wrap(
        <SessionGate>
          <p dir="auto">الفوترة</p>
        </SessionGate>,
        "rtl",
      ),
    );
    const text = screen.getByText("الفوترة");
    expect(text.closest("[dir='rtl']")).toBeTruthy();
    expect(text.getAttribute("dir")).toBe("auto");
  });
});
