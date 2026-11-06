/**
 * Stackra file contract:
 * Purpose: proves the PasswordReset block asks for the email and sends it through `onRequest`, then says the link went
 *          and reports done; sets the new password from the token through `onReset` and reports done; ties the
 *          policy's checklist to the password field; announces the host's `failed` words when a call fails or the
 *          link has no token; titles itself at h2 unless told; and lays out logically in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui components.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0207 (decision 3); ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { PasswordReset } from "#react/password-reset/password-reset";

const LABELS = {
  title: "Reset your password",
  email: "Email",
  password: "New password",
  submit: "Continue",
  sent: "If an account uses that address, we sent it a link.",
  failed: "That didn't work.",
  rules: {
    label: "Password rules",
    minLength: "At least 12 characters",
    uppercase: "A capital letter",
    lowercase: "A small letter",
    number: "A number",
    symbol: "A symbol",
    met: "Met",
    unmet: "Not yet",
  },
};

const POLICY = {
  minLength: 12,
  hasUppercase: false,
  hasLowercase: false,
  hasNumber: false,
  hasSymbol: false,
};

/** Submits the form with the button. */
async function submit() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  });
}

describe("PasswordReset", () => {
  afterEach(cleanup);

  it("sends the email, says the link went and reports done", async () => {
    const [onRequest, onDone] = [vi.fn(() => Promise.resolve()), vi.fn()];
    render(<PasswordReset step="request" onRequest={onRequest} onDone={onDone} labels={LABELS} />);
    expect(screen.getByRole("heading", { level: 2, name: "Reset your password" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "rana@acme.example" } });
    await submit();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(onRequest).toHaveBeenCalledWith("rana@acme.example");
    expect(screen.getByText(LABELS.sent)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
  });

  it("sets the password from the token and reports done", async () => {
    const [onReset, onDone] = [vi.fn(() => Promise.resolve()), vi.fn()];
    render(
      <PasswordReset
        step="reset"
        token="tok_1"
        onReset={onReset}
        onDone={onDone}
        headingLevel={1}
        labels={LABELS}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/New password/), {
      target: { value: "a long new password" },
    });
    await submit();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(onReset).toHaveBeenCalledWith({ token: "tok_1", password: "a long new password" });
  });

  it("ties the policy's checklist to the password field", () => {
    render(<PasswordReset step="reset" token="tok_1" policy={POLICY} labels={LABELS} />);
    const field = screen.getByLabelText(/New password/);
    const describedBy = field.getAttribute("aria-describedby") ?? "";
    const description = describedBy
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ");
    expect(description).toContain("At least 12 characters");
  });

  it("announces the host's words when a call fails", async () => {
    const onDone = vi.fn();
    render(
      <PasswordReset
        step="request"
        onRequest={() => Promise.reject(new Error("down"))}
        onDone={onDone}
        labels={LABELS}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "rana@acme.example" } });
    await submit();
    expect((await screen.findByRole("alert")).textContent).toContain(LABELS.failed);
    expect(onDone).not.toHaveBeenCalled();
  });

  it("says the link is not valid without a token", () => {
    render(<PasswordReset step="reset" labels={LABELS} />);
    expect(screen.getByRole("alert").textContent).toContain(LABELS.failed);
    expect(screen.queryByLabelText(/New password/)).toBeNull();
  });

  it("lays out logically in Arabic", () => {
    render(
      <div dir="rtl">
        <PasswordReset step="request" labels={{ ...LABELS, title: "إعادة تعيين كلمة المرور" }} />
      </div>,
    );
    const heading = screen.getByRole("heading", { name: "إعادة تعيين كلمة المرور" });
    expect(heading.closest("[dir='rtl']")).toBeTruthy();
    const form = screen.getByRole("button", { name: "Continue" }).closest("form");
    expect(form?.className).toMatch(/\bflex-col\b/);
    expect(form?.className).not.toMatch(/\b(text-left|text-right|ml-|mr-|pl-|pr-)/);
  });
});
