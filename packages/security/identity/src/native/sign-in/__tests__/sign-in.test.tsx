/**
 * Stackra file contract:
 * Purpose: proves the native SignIn block shows the tenant's providers and form, reports a provider press and the
 *          typed email, password and remember choice (by the button and by the password's return key), announces an
 *          error, refuses a second submit while one is pending, drops the form and divider when no `onSubmit` is
 *          given, hides the links without their handlers, titles itself as a header, and keeps working under
 *          `dir="rtl"` with logical sides only.
 * Boundary: unit tier, jsdom. React Native does not render in vitest, so `@stackra/ui/native` is replaced by DOM
 *           stand-ins that keep each part's contract (roles, names, value and change, return key).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0060 (RTL).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { SignIn } from "#native/sign-in/sign-in";

/** What the stand-in fields receive. */
interface FieldStandInProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmitEditing?: () => void;
  readonly isDisabled?: boolean;
}

/** What the stand-ins with children receive. */
interface PartStandInProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  const part =
    (tag: string) =>
    ({ children, className }: PartStandInProps) =>
      createElement(tag, { className }, children);
  const field =
    (type: string) =>
    ({ label, value, onChange, onSubmitEditing, isDisabled }: FieldStandInProps) =>
      createElement("input", {
        type,
        "aria-label": label,
        value,
        disabled: isDisabled,
        onChange: (event: { target: { value: string } }) => onChange(event.target.value),
        onKeyDown: (event: { key: string }) => event.key === "Enter" && onSubmitEditing?.(),
      });
  const Card = Object.assign(part("section"), {
    Header: part("header"),
    Title: ({ children }: PartStandInProps) =>
      createElement("div", { role: "heading", "aria-level": 2 }, children),
    Description: part("p"),
    Content: part("div"),
    Footer: part("footer"),
  });
  return {
    Card,
    Text: part("span"),
    Stack: part("div"),
    Cluster: part("div"),
    Separator: () => createElement("hr"),
    Alert: ({ title }: { readonly title: string }) =>
      createElement("div", { role: "alert" }, title),
    TextField: field("email"),
    PasswordField: field("password"),
    Checkbox: ({
      label,
      value,
      onChange,
    }: {
      readonly label: string;
      readonly value: boolean;
      readonly onChange: (value: boolean) => void;
    }) =>
      createElement("input", {
        type: "checkbox",
        "aria-label": label,
        checked: value,
        onChange: () => onChange(!value),
      }),
    Link: ({ children, onPress }: PartStandInProps & { readonly onPress: () => void }) =>
      createElement("a", { role: "link", tabIndex: 0, onClick: onPress }, children),
    Button: ({
      children,
      onPress,
      isDisabled,
      isLoading,
    }: PartStandInProps & {
      readonly onPress: () => void;
      readonly isDisabled?: boolean;
      readonly isLoading?: boolean;
    }) =>
      createElement(
        "button",
        { type: "button", onClick: onPress, disabled: isDisabled, "aria-busy": isLoading },
        children,
      ),
    SocialSignInButtons: ({
      providers,
      onSignIn,
      pendingId,
      isDisabled,
    }: {
      readonly providers: readonly { readonly id: string; readonly name: string }[];
      readonly onSignIn: (id: string) => void;
      readonly pendingId?: string;
      readonly isDisabled?: boolean;
    }) =>
      createElement(
        "div",
        null,
        providers.map((provider) =>
          createElement(
            "button",
            {
              key: provider.id,
              type: "button",
              disabled: isDisabled,
              "aria-busy": pendingId === provider.id,
              onClick: () => onSignIn(provider.id),
            },
            provider.name,
          ),
        ),
      ),
  };
});

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

const PROVIDERS = [{ id: "google", name: "Google" }];

/** Types the demo credentials into the form. */
function typeCredentials() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sara@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
}

describe("SignIn (native)", () => {
  afterEach(cleanup);

  it("reports a provider and the form values, and announces the error", () => {
    const [onProvider, onSubmit] = [vi.fn(), vi.fn()];
    render(
      <SignIn
        providers={PROVIDERS}
        onProvider={onProvider}
        onSubmit={onSubmit}
        error="Wrong password"
        labels={LABELS}
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe("Wrong password");
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeTruthy();
    expect(screen.getByText("or")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Google" }));
    expect(onProvider).toHaveBeenCalledWith("google");
    typeCredentials();
    fireEvent.click(screen.getByRole("checkbox", { name: "Remember me" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign in now" }));
    expect(onSubmit).toHaveBeenCalledWith({
      email: "sara@example.com",
      password: "secret",
      remember: true,
    });
  });

  it("submits from the password's return key", () => {
    const onSubmit = vi.fn();
    render(<SignIn onSubmit={onSubmit} labels={LABELS} />);
    typeCredentials();
    fireEvent.keyDown(screen.getByLabelText("Password"), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith({
      email: "sara@example.com",
      password: "secret",
      remember: false,
    });
  });

  it("waits while a sign-in is pending", () => {
    const onSubmit = vi.fn();
    render(<SignIn providers={PROVIDERS} onSubmit={onSubmit} pending="form" labels={LABELS} />);
    const submit = screen.getByRole("button", { name: "Sign in now" });
    expect(submit.getAttribute("aria-busy")).toBe("true");
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Google" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.keyDown(screen.getByLabelText("Password"), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("is provider-only without onSubmit, and shows the links only with their handlers", () => {
    const { rerender } = render(<SignIn providers={PROVIDERS} labels={LABELS} />);
    expect(screen.queryByRole("button", { name: "Sign in now" })).toBeNull();
    expect(screen.queryByText("or")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    const [onForgotPassword, onSignUp] = [vi.fn(), vi.fn()];
    rerender(
      <SignIn
        onSubmit={vi.fn()}
        onForgotPassword={onForgotPassword}
        onSignUp={onSignUp}
        labels={LABELS}
      />,
    );
    fireEvent.click(screen.getByRole("link", { name: "Forgot password?" }));
    fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
    expect(onForgotPassword).toHaveBeenCalledOnce();
    expect(onSignUp).toHaveBeenCalledOnce();
    expect(screen.getByText("New here?")).toBeTruthy();
  });

  it("works under dir=rtl and uses no physical sides", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <div dir="rtl">
        <SignIn providers={PROVIDERS} onSubmit={onSubmit} onSignUp={vi.fn()} labels={LABELS} />
      </div>,
    );
    typeCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Sign in now" }));
    expect(onSubmit).toHaveBeenCalledOnce();
    const classes = [...container.querySelectorAll("[class]")].map((node) => node.className);
    expect(classes.join(" ")).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-|\btext-(?:left|right)\b/);
  });
});
