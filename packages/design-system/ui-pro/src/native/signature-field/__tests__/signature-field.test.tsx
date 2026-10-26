/**
 * Stackra file contract:
 * Purpose: proves the native SignatureField reports a drawn signature as a path in the box's own units (scaled from
 *          the drawn width), reports a typed name and replaces a drawing with it, clears to null, names the box by
 *          its label as an image, and refuses to start a stroke while disabled.
 * Boundary: React Native does not render in vitest: react-native (View, PanResponder), Skia and `@stackra/ui/native`
 *           are replaced by stand-ins; a PanResponder stand-in hands back its config, so a test drives the stroke.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1 and 2.5.7; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { SignatureField } from "#native/signature-field/signature-field";

/** The props of the drawing box, as last handed to its View. */
const box = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    PanResponder: { create: (config: object) => ({ panHandlers: { config } }) },
    View: (props: Record<string, unknown>) => {
      if (props["accessibilityRole"] === "image") box.props = props;
      return createElement(
        "div",
        {
          role: props["accessibilityRole"],
          "aria-label": props["accessibilityLabel"],
        },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("@shopify/react-native-skia", () => ({
  Canvas: ({ children }: { children?: ReactNode }) => <svg>{children}</svg>,
  Path: ({ path }: { path: string }) => <path data-testid="ink" d={path} />,
}));
vi.mock("@stackra/ui/native", () => ({
  useThemeColor: () => "#000",
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  TextField: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (text: string) => void;
  }) => (
    <input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
  Button: ({
    children,
    onPress,
    isDisabled,
  }: {
    children?: ReactNode;
    onPress: () => void;
    isDisabled?: boolean;
  }) => (
    <button type="button" disabled={isDisabled} onClick={onPress}>
      {children}
    </button>
  ),
}));

/** The gesture config the box was handed. */
type Config = Record<string, (event?: unknown, state?: unknown) => unknown>;
const config = (): Config => box.props["config"] as Config;
const touch = (x: number, y: number) => ({ nativeEvent: { locationX: x, locationY: y } });

/** Renders the field 200 points wide, so one point is two box units. */
function renderField(isDisabled = false) {
  const onChange = vi.fn();
  render(
    <SignatureField
      label="Signature"
      typedLabel="Or type your name"
      clearLabel="Clear"
      onChange={onChange}
      isDisabled={isDisabled}
    />,
  );
  act(() =>
    (box.props["onLayout"] as (layout: object) => void)({
      nativeEvent: { layout: { width: 200 } },
    }),
  );
  return onChange;
}

describe("SignatureField (native)", () => {
  it("names the box by the label and reports a stroke in the box's units", () => {
    const onChange = renderField();
    expect(screen.getByRole("image", { name: "Signature" })).toBeTruthy();
    act(() => {
      config()["onPanResponderGrant"]?.(touch(10, 5));
      config()["onPanResponderMove"]?.(touch(20, 5));
      config()["onPanResponderRelease"]?.();
    });
    // 200 points drawn for 400 units: each point is two units.
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "drawn",
      path: "M20 10L40 10",
      viewBox: "0 0 400 150",
    });
  });

  it("reports a typed name, and clears to null", () => {
    const onChange = renderField();
    fireEvent.change(screen.getByLabelText("Or type your name"), { target: { value: "Sara Ali" } });
    expect(onChange).toHaveBeenLastCalledWith({ kind: "typed", text: "Sara Ali" });
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("starts no stroke while disabled", () => {
    renderField(true);
    expect(config()["onStartShouldSetPanResponder"]?.()).toBe(false);
  });
});
