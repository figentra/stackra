/**
 * Stackra file contract:
 * Purpose: proves the native ColorPicker: the swatches (named by a text label or the catalogue) and a hex field kept
 *          left to right over the same colour, starting at the first swatch; a swatch or a whole typed hex (three or
 *          six digits, with or without `#`) is reported and kept when uncontrolled; a partial hex stays typed without
 *          a report; disabled reaches both.
 * Boundary: React Native does not render in vitest, so it and the house SwatchGroup, TextField and Text are recording
 *           stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0060;
 *          ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ColorPicker } from "#native/color-picker/color-picker";

const state = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
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
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/settings-cell/swatch-group", () => ({
  SwatchGroup: (props: Record<string, unknown>) => {
    state.props["swatches"] = props;
    return null;
  },
}));
vi.mock("#native/text-field/text-field", () => ({
  TextField: (props: Record<string, unknown>) => {
    state.props["hex"] = props;
    return null;
  },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const propsOf = (name: string) => state.props[name] ?? {};
const type = (text: string) => act(() => (propsOf("hex")["onChange"] as (t: string) => void)(text));
const swatch = (hex: string) =>
  act(() => (propsOf("swatches")["onChange"] as (h: string) => void)(hex));
const preview = () =>
  // oxlint-disable-next-line unicorn/prefer-array-find -- reason: findLast is ES2023 and the base lib is ES2022
  [...state.views].reverse().find((view) => String(view["className"]).startsWith("size-11"));

beforeEach(() => {
  state.props = {};
  state.views.length = 0;
});

describe("ColorPicker (native)", () => {
  it("starts at the first swatch, named by the label, with a left-to-right hex field", () => {
    render(
      <ColorPicker label="Accent" description="Brand colour" swatches={["#ff0000", "#00ff00"]} />,
    );
    expect(propsOf("swatches")).toMatchObject({ label: "Accent", value: "#ff0000" });
    expect(propsOf("hex")).toMatchObject({
      label: "ui::color_picker.hex",
      value: "#ff0000",
      autoCapitalize: "none",
      autoCorrect: false,
    });
    expect(
      state.views.some((view) => (view["style"] as { direction?: string })?.direction === "ltr"),
    ).toBe(true);
    expect(preview()?.["style"]).toEqual({ backgroundColor: "#ff0000" });
    expect(screen.getByText("Brand colour")).toBeTruthy();
  });

  it("reports a swatch and a whole typed hex, keeping a partial one typed", () => {
    const onChange = vi.fn();
    render(<ColorPicker onChange={onChange} swatches={["#ff0000"]} />);
    expect(propsOf("swatches")["label"]).toBe("ui::color_picker.swatches");
    swatch("#123456");
    expect(onChange).toHaveBeenLastCalledWith("#123456");
    expect(propsOf("hex")["value"]).toBe("#123456");
    type("#ab");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(propsOf("hex")["value"]).toBe("#ab");
    type("ABC");
    expect(onChange).toHaveBeenLastCalledWith("#aabbcc");
    expect(propsOf("hex")["value"]).toBe("#aabbcc");
    expect(preview()?.["style"]).toEqual({ backgroundColor: "#aabbcc" });
  });

  it("shows the owner's colour, keeps it on a change and disables both parts", () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#000000" onChange={onChange} isDisabled label={<b>Rich</b>} />);
    expect(propsOf("swatches")).toMatchObject({
      label: "ui::color_picker.swatches",
      isDisabled: true,
    });
    expect(propsOf("hex")["isDisabled"]).toBe(true);
    type("ffffff");
    expect(onChange).toHaveBeenCalledWith("#ffffff");
    expect(propsOf("hex")["value"]).toBe("#000000");
  });

  it("starts from defaultValue, and from black with no swatches", () => {
    const { unmount } = render(<ColorPicker defaultValue="#00ff00" />);
    expect(propsOf("hex")["value"]).toBe("#00ff00");
    expect(propsOf("hex")).not.toHaveProperty("isDisabled");
    unmount();
    render(<ColorPicker swatches={[]} />);
    expect(propsOf("hex")["value"]).toBe("#000000");
  });
});
