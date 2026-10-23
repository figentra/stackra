/**
 * Stackra file contract:
 * Purpose: proves the native IconButton hands HeroUI Native the icon-only flag and the accessibility label, draws its
 *          icon as the only child, swaps it for the spinner while loading, and that the type refuses a missing label.
 * Boundary: React Native does not render in vitest, so heroui-native and lucide-react-native are replaced by recording
 *          stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.2; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-023 sta-350:FR-024 sta-350:P-016
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { IconButtonContractProps } from "#contracts/types/icon-button-contract-props.type";
import { IconButton, type IconButtonProps } from "#native/icon-button/icon-button";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Button: Object.assign(record("button"), { Label: record("label") }),
    Spinner: record("spinner"),
    useThemeColor: (name: string) => `color:${name}`,
    cn: (...parts: unknown[]) => parts.filter(Boolean).join(" "),
  };
});

vi.mock("lucide-react-native", async () => {
  const { createElement } = await import("react");
  return {
    LucideProvider: (props: Record<string, unknown>) =>
      createElement("div", { "data-testid": "provider" }, props["children"] as ReactNode),
  };
});

const propsOf = (name: string) => received.props[name] ?? {};
const icon = <i data-testid="icon" />;

describe("IconButton (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("is HeroUI Native's icon-only button, named by label, with the icon as its child", () => {
    const { container } = render(<IconButton icon={icon} label="Settings" />);
    expect(propsOf("button")).toMatchObject({ isIconOnly: true, accessibilityLabel: "Settings" });
    expect(container.querySelector('[data-testid="icon"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="label"]')).toBeNull();
  });

  it("swaps the icon for the spinner while loading and keeps its name", () => {
    const { container } = render(<IconButton icon={icon} label="Settings" isLoading />);
    expect(container.querySelector('[data-testid="icon"]')).toBeNull();
    expect(container.querySelector('[data-testid="spinner"]')).toBeTruthy();
    expect(propsOf("button")["accessibilityLabel"]).toBe("Settings");
  });

  it("forwards the variant, the size and the press", () => {
    const onPress = vi.fn();
    render(<IconButton icon={icon} label="Delete" variant="danger" size="lg" onPress={onPress} />);
    expect(propsOf("button")).toMatchObject({ variant: "danger", size: "lg", onPress });
  });

  it("requires a label and has no text or full-width props", () => {
    expectTypeOf<IconButtonProps>().toExtend<IconButtonContractProps>();
    // @ts-expect-error nothing else names an icon-only button
    void (<IconButton icon={icon} />);
    void (
      (
        // @ts-expect-error an icon button has no text children
        <IconButton icon={icon} label="x">
          text
        </IconButton>
      )
    );
  });
});
