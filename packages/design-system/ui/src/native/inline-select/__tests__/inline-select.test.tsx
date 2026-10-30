/**
 * Stackra file contract:
 * Purpose: proves the native InlineSelect: HeroUI Native's Select drawn as an underlined word, its trigger named by
 *          the label and saying the chosen label, starting at the first item; each item is offered (disabled ones
 *          disabled) in a popover; a choice is reported and kept when uncontrolled, an empty choice ignored; disabled
 *          mutes the word.
 * Boundary: React Native and heroui-native do not render in vitest, so they and the house Text and Icon are
 *           recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC
 *          4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { InlineSelect } from "#native/inline-select/inline-select";

const state = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  items: [] as Record<string, unknown>[],
  texts: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
  };
});
vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    state.props[name] = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Select: Object.assign(record("select"), {
      Trigger: record("trigger"),
      Portal: record("portal"),
      Overlay: record("overlay"),
      Content: record("content"),
      Item: (props: Record<string, unknown>) => {
        state.items.push(props);
        return null;
      },
    }),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      state.texts.push(props);
      return createElement("span", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));

const ITEMS = [
  { id: "d", label: "daily" },
  { id: "w", label: "weekly", isDisabled: true },
  { id: "m", label: "monthly" },
];
const propsOf = (name: string) => state.props[name] ?? {};
const choose = (option: unknown) =>
  act(() => (propsOf("select")["onValueChange"] as (o: unknown) => void)(option));

beforeEach(() => {
  state.props = {};
  state.items.length = 0;
  state.texts.length = 0;
});

describe("InlineSelect (native)", () => {
  it("starts at the first item, says it and offers every item in a popover", () => {
    render(<InlineSelect items={ITEMS} label="Frequency" />);
    expect(propsOf("select")).toMatchObject({
      isDisabled: false,
      value: { value: "d", label: "daily" },
      className: "self-start ",
    });
    expect(propsOf("trigger")).toMatchObject({
      accessibilityLabel: "Frequency",
      accessibilityValue: { text: "daily" },
    });
    expect(propsOf("content")).toMatchObject({ presentation: "popover", width: 220 });
    expect(state.items.map((item) => [item["value"], item["disabled"]])).toEqual([
      ["d", false],
      ["w", true],
      ["m", false],
    ]);
    expect(state.texts[0]?.["tone"]).toBe("accent");
  });

  it("reports and keeps a choice, ignoring an empty one", () => {
    const onChange = vi.fn();
    render(<InlineSelect items={ITEMS} label="Frequency" onChange={onChange} />);
    choose({ value: "m", label: "monthly" });
    expect(onChange).toHaveBeenCalledWith("m");
    expect(screen.getByText("monthly")).toBeTruthy();
    choose(undefined);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("shows the owner's choice, keeps it, and mutes when disabled", () => {
    const onChange = vi.fn();
    render(
      <InlineSelect
        items={ITEMS}
        label="Frequency"
        value="m"
        onChange={onChange}
        isDisabled
        className="x"
      />,
    );
    choose({ value: "d", label: "daily" });
    expect(onChange).toHaveBeenCalledWith("d");
    expect(propsOf("trigger")["accessibilityValue"]).toEqual({ text: "monthly" });
    expect(state.texts.at(-1)?.["tone"]).toBe("muted");
  });

  it("has no value with an unknown key or no items", () => {
    render(<InlineSelect items={[]} label="Empty" defaultValue="zz" />);
    expect(propsOf("select")).not.toHaveProperty("value");
    expect(propsOf("trigger")["accessibilityValue"]).toEqual({ text: "" });
  });
});
