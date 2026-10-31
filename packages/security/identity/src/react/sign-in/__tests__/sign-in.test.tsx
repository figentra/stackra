/**
 * Stackra file contract:
 * Purpose: proves the SignIn block shows the tenant's providers and form, reports a provider press and the submitted
 *          email, password and remember choice, shows an error, and drops the form when no `onSubmit` is given.
 * Boundary: unit tier, jsdom, the real @stackra/ui components.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { SignIn } from "#react/sign-in/sign-in";

const LABELS = {
  title: "Sign in",
  email: "Email",
  password: "Password",
  remember: "Remember me",
  submit: "Sign in now",
  forgotPassword: "Forgot password?",
  divider: "or",
  signUpPrompt: "New here?",
  signUp: "Create an account",
};

describe("SignIn", () => {
  afterEach(cleanup);

  it("reports a provider and the form values", () => {
    const [onProvider, onSubmit] = [vi.fn(), vi.fn()];
    render(
      <SignIn
        providers={[{ id: "google", name: "Google" }]}
        onProvider={onProvider}
        onSubmit={onSubmit}
        error="Wrong password"
        labels={LABELS}
      />,
    );
    expect(screen.getByText("Wrong password")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Google/ }));
    expect(onProvider).toHaveBeenCalledWith("google");
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "sara@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Remember me" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign in now" }));
    expect(onSubmit).toHaveBeenCalledWith({
      email: "sara@example.com",
      password: "secret",
      remember: true,
    });
  });

  it("is provider-only without onSubmit", () => {
    render(<SignIn providers={[{ id: "apple", name: "Apple" }]} labels={LABELS} />);
    expect(screen.queryByRole("button", { name: "Sign in now" })).toBeNull();
    expect(screen.queryByText("or")).toBeNull();
  });
});
