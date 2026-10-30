/**
 * Stackra file contract:
 * Purpose: proves the native SocialSignInButtons: one full-width "continue with" button per provider (isolated name,
 *          or the caller's words), drawn with its built-in mark (outlined marks in the text colour), its own icon, or
 *          its first letter; icon buttons in a row; a press reports the provider's id; the pending provider spins and
 *          the others and a disabled set cannot be pressed.
 * Boundary: React Native, heroui-native and react-native-svg do not render in vitest, so they and the house Button,
 *           IconButton and Text are recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (isolated names); WCAG 2.2 SC 2.5.3 and 4.1.2; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { SocialSignInButtons } from "#native/social-sign-in-buttons/social-sign-in-buttons";

const state = vi.hoisted(() => ({
  buttons: [] as Record<string, unknown>[],
  paths: [] as Record<string, unknown>[],
  views: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("heroui-native", () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
  useThemeColor: () => "#111111",
}));
vi.mock("react-native-svg", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: Record<string, unknown>) =>
      createElement("svg", { "data-testid": props["testID"] }, props["children"] as ReactNode),
    Path: (props: Record<string, unknown>) => {
      state.paths.push(props);
      return null;
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      state.buttons.push(props);
      return createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["startIcon"] as ReactElement,
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) => {
      state.buttons.push(props);
      return createElement(
        "button",
        {
          type: "button",
          "aria-label": props["label"] as string,
          onClick: props["onPress"] as () => void,
        },
        props["icon"] as ReactElement,
      );
    },
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

const PROVIDERS = [
  { id: "google", name: "Google" },
  { id: "email", name: "Email" },
  { id: "acme", name: "Acme" },
  { id: "sso", name: "SSO", icon: <i data-testid="own-icon" /> },
];

beforeEach(() => {
  state.buttons.length = 0;
  state.paths.length = 0;
  state.views.length = 0;
});

describe("SocialSignInButtons (native)", () => {
  it("draws a full-width button per provider with its mark, its icon or its letter", () => {
    const onSignIn = vi.fn();
    render(<SocialSignInButtons providers={PROVIDERS} onSignIn={onSignIn} className="x" />);
    expect(state.views[0]?.["className"]).toBe("gap-2 x");
    expect(state.buttons.map((button) => [button["variant"], button["isFullWidth"]])).toEqual(
      Array.from({ length: 4 }, () => ["outline", true]),
    );
    expect(String(state.buttons[0]?.["children"])).toContain("ui::social_sign_in.continue_with");
    expect(String(state.buttons[0]?.["children"])).toContain("Google");
    expect(screen.getByTestId("mark-google")).toBeTruthy();
    expect(screen.getByTestId("mark-email")).toBeTruthy();
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByTestId("own-icon")).toBeTruthy();
    expect(state.paths.find((path) => path["stroke"])).toMatchObject({
      fill: "none",
      stroke: "#111111",
      strokeWidth: 2,
    });
    fireEvent.click(screen.getByText("A").closest("button") as HTMLElement);
    expect(onSignIn).toHaveBeenCalledWith("acme");
  });

  it("draws icon buttons in a row with the caller's words, spinning the pending one", () => {
    render(
      <SocialSignInButtons
        providers={PROVIDERS}
        orientation="horizontal"
        pendingId="email"
        labelOf={(provider) => `Use ${provider.name}`}
      />,
    );
    expect(state.views[0]?.["className"]).toBe("flex-row flex-wrap gap-2");
    expect(
      state.buttons.map((button) => [button["label"], button["isLoading"], button["isDisabled"]]),
    ).toEqual([
      ["Use Google", false, true],
      ["Use Email", true, false],
      ["Use Acme", false, true],
      ["Use SSO", false, true],
    ]);
    fireEvent.click(screen.getByLabelText("Use Google"));
  });

  it("takes a provider's mark by name and disables the whole set", () => {
    render(
      <SocialSignInButtons
        providers={[{ id: "corp", name: "Corp", provider: "apple" }]}
        isDisabled
      />,
    );
    expect(screen.getByTestId("mark-apple")).toBeTruthy();
    expect(state.buttons[0]).toMatchObject({ isDisabled: true, isLoading: false });
  });
});
