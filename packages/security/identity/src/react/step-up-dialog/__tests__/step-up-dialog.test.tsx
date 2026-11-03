/**
 * Stackra file contract:
 * Purpose: proves the StepUpDialog is a dialog named by the host's title that says why and names the accepted factors,
 *          runs the session's step-up sign-in (`prompt=login`, `max_age=0`) on verify and then closes and reports it,
 *          stays open and quiet when the sign-in is cancelled, announces the host's `failed` words in an alert on any
 *          other failure, closes on cancel and on Escape, and lays out logically in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui Modal and a `SessionFake` bound in a real container; the sign-in is
 *           the fake's spy.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0207 (decision 1); ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { SessionService, SessionStatus, SignInCancelledError, stepUpSignIn } from "#core/index";
import { StepUpDialog } from "#react/step-up-dialog/step-up-dialog";
import { SessionFake } from "#testing/session.fake";

const LABELS = {
  title: "Confirm it's you",
  methodsIntro: "You can use:",
  methods: {
    passkey: "A passkey",
    totp: "An authenticator code",
    password: "Your password",
    "backup-code": "A backup code",
  },
  verify: "Continue",
  cancel: "Cancel",
  failed: "We couldn't verify you.",
};

/** A signed-in fake whose sign-in is `signIn`, and a wrapper that binds it. */
async function setUp(signIn: () => Promise<void> = () => Promise.resolve()) {
  const session = new SessionFake().seed({ status: SessionStatus.SignedIn, signIn });
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

describe("StepUpDialog", () => {
  afterEach(cleanup);

  it("names itself and says why and with what", async () => {
    const { wrap } = await setUp();
    render(
      wrap(
        <StepUpDialog
          isOpen
          methods={["passkey", "totp"]}
          reason="Changing your password needs a fresh sign-in."
          labels={LABELS}
        />,
      ),
    );
    const dialog = screen.getByRole("dialog", { name: "Confirm it's you" });
    expect(dialog.textContent).toContain("Changing your password needs a fresh sign-in.");
    expect(screen.getByText("A passkey")).toBeTruthy();
    expect(screen.getByText("An authenticator code")).toBeTruthy();
    expect(screen.queryByText("Your password")).toBeNull();
  });

  it("runs the step-up sign-in, then closes and reports it", async () => {
    const { session, wrap } = await setUp();
    const [onOpenChange, onVerified] = [vi.fn(), vi.fn()];
    render(
      wrap(
        <StepUpDialog isOpen onOpenChange={onOpenChange} onVerified={onVerified} labels={LABELS} />,
      ),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    });
    await waitFor(() => expect(onVerified).toHaveBeenCalled());
    expect(session.signIn).toHaveBeenCalledWith(stepUpSignIn());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("stays open and quiet when the sign-in is cancelled", async () => {
    const { wrap } = await setUp(() => Promise.reject(SignInCancelledError.create()));
    const [onOpenChange, onVerified] = [vi.fn(), vi.fn()];
    render(
      wrap(
        <StepUpDialog isOpen onOpenChange={onOpenChange} onVerified={onVerified} labels={LABELS} />,
      ),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(onVerified).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("announces the host's words when the sign-in fails", async () => {
    const { wrap } = await setUp(() => Promise.reject(new Error("provider down")));
    const onVerified = vi.fn();
    render(wrap(<StepUpDialog isOpen onVerified={onVerified} labels={LABELS} />));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    });
    expect((await screen.findByRole("alert")).textContent).toContain(LABELS.failed);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("closes on cancel and on Escape", async () => {
    const { wrap } = await setUp();
    const onOpenChange = vi.fn();
    render(wrap(<StepUpDialog isOpen onOpenChange={onOpenChange} labels={LABELS} />));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    onOpenChange.mockClear();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("lays out logically in Arabic", async () => {
    const { wrap } = await setUp();
    render(
      wrap(
        <StepUpDialog isOpen methods={["passkey"]} labels={{ ...LABELS, title: "تأكيد هويتك" }} />,
        "rtl",
      ),
    );
    expect(screen.getByRole("dialog", { name: "تأكيد هويتك" })).toBeTruthy();
    const list = screen.getByRole("list");
    expect(list.className).toMatch(/\bps-5\b/);
    expect(list.className).not.toMatch(/\b(pl-|pr-|ml-|mr-)/);
  });
});
