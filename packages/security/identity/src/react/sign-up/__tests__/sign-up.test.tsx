/**
 * Stackra file contract:
 * Purpose: proves the SignUp block reports a provider, walks its steps behind a named stepper (the account values, the
 *          emailed code, the organisation) through the host's calls, hands the session to `onSignedUp` once signed in
 *          after the last step, stays on a step and announces the host's `failed` words when its call fails, shows the
 *          terms and privacy links only with both hrefs, and lays out logically in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui components and a `SessionFake` bound in a real container; the last
 *           call signs the fake in, as a host's registration does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0206; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { SessionService, SessionStatus } from "#core/index";
import { SignUp } from "#react/sign-up/sign-up";
import { SessionFake } from "#testing/session.fake";

const LABELS = {
  title: "Create your account",
  progress: "Sign-up progress",
  steps: { account: "Account", verify: "Verify", organization: "Organisation" },
  name: "Name",
  email: "Email",
  password: "Password",
  code: "Code from your email",
  organization: "Organisation name",
  next: "Continue",
  submit: "Create account",
  divider: "or",
  agreement: "By continuing you agree to the",
  terms: "Terms",
  and: "and",
  privacy: "Privacy policy",
  failed: "We couldn't do that.",
};

/** A signed-out fake and a wrapper that binds it. */
async function setUp() {
  const session = new SessionFake().seed({ status: SessionStatus.SignedOut });
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

/** Presses the step's button named `name`. */
async function press(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
}

/** Fills the account step. */
function fillAccount() {
  fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Rana" } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "rana@acme.example" } });
  fireEvent.change(screen.getByLabelText(/^Password/), {
    target: { value: "a long new password" },
  });
}

describe("SignUp", () => {
  afterEach(cleanup);

  it("reports a provider", async () => {
    const { wrap } = await setUp();
    const onProvider = vi.fn();
    render(
      wrap(
        <SignUp
          providers={[{ id: "google", name: "Google" }]}
          onProvider={onProvider}
          labels={LABELS}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: /Google/ }));
    expect(onProvider).toHaveBeenCalledWith("google");
  });

  it("walks its steps and hands the session over once signed in", async () => {
    const { session, wrap } = await setUp();
    const onAccount = vi.fn(() => Promise.resolve());
    const onVerify = vi.fn(() => Promise.resolve());
    const onOrganization = vi.fn(() => session.signIn());
    const onSignedUp = vi.fn();
    render(
      wrap(
        <SignUp
          steps={["account", "verify", "organization"]}
          providers={[]}
          onAccount={onAccount}
          onVerify={onVerify}
          onOrganization={onOrganization}
          onSignedUp={onSignedUp}
          labels={LABELS}
        />,
      ),
    );
    expect(screen.getByRole("group", { name: "Sign-up progress" })).toBeTruthy();
    fillAccount();
    await press("Continue");
    expect(onAccount).toHaveBeenCalledWith({
      name: "Rana",
      email: "rana@acme.example",
      password: "a long new password",
    });
    fireEvent.change(screen.getByLabelText(/Code from your email/), {
      target: { value: "123456" },
    });
    await press("Continue");
    expect(onVerify).toHaveBeenCalledWith("123456");
    fireEvent.change(screen.getByLabelText(/^Organisation name/), {
      target: { value: "Acme" },
    });
    await press("Create account");
    expect(onOrganization).toHaveBeenCalledWith({ name: "Acme" });
    await waitFor(() => expect(onSignedUp).toHaveBeenCalledTimes(1));
    expect(onSignedUp.mock.calls[0]?.[0].user.email).toBe("user@example.test");
  });

  it("stays on the step and announces the host's words when its call fails", async () => {
    const { wrap } = await setUp();
    render(
      wrap(
        <SignUp
          providers={[]}
          onAccount={() => Promise.reject(new Error("taken"))}
          labels={LABELS}
        />,
      ),
    );
    fillAccount();
    await press("Continue");
    expect((await screen.findByRole("alert")).textContent).toContain(LABELS.failed);
    expect(screen.getByLabelText(/^Email/)).toBeTruthy();
  });

  it("shows the agreement only with both links", async () => {
    const { wrap } = await setUp();
    const { rerender } = render(wrap(<SignUp providers={[]} termsHref="/terms" labels={LABELS} />));
    expect(screen.queryByRole("link", { name: "Terms" })).toBeNull();
    rerender(
      wrap(<SignUp providers={[]} termsHref="/terms" privacyHref="/privacy" labels={LABELS} />),
    );
    expect(screen.getByRole("link", { name: "Terms" }).getAttribute("href")).toBe("/terms");
    expect(screen.getByRole("link", { name: "Privacy policy" }).getAttribute("href")).toBe(
      "/privacy",
    );
  });

  it("lays out logically in Arabic", async () => {
    const { wrap } = await setUp();
    render(
      wrap(
        <SignUp
          providers={[{ id: "google", name: "Google" }]}
          labels={{ ...LABELS, title: "أنشئ حسابك" }}
        />,
        "rtl",
      ),
    );
    expect(screen.getByRole("heading", { name: "أنشئ حسابك" }).closest("[dir='rtl']")).toBeTruthy();
    const separator = screen.getByRole("separator", { name: "or" });
    expect(separator.className).not.toMatch(/\b(text-left|text-right|ml-|mr-|pl-|pr-)/);
  });
});
