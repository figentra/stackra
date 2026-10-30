/**
 * Stackra file contract:
 * Purpose: proves the native settings family: the SettingsCell draws its icon, title and muted line (hidden from the
 *          reader, since the control names itself), drops its frame in an ItemCardGroup and dims when disabled; the
 *          switch, select, slider and colour cells name their control by the title and pass value, change and
 *          disabled through, the slider and colour cells hold their own value when uncontrolled, and the swatches are
 *          radios that play a selection haptic and mark the chosen one with a contrasting dot.
 * Boundary: React Native and heroui-native do not render in vitest, so they and the house Switch, InlineSelect, Icon
 *           and Text are recording stand-ins that render plain DOM; what each control is handed is checked.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC
 *          4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { ItemCardGroupContext } from "#native/item-card/item-card-group-context";
import { SettingsCell } from "#native/settings-cell/settings-cell";
import { SettingsColorCell } from "#native/settings-cell/settings-color-cell";
import { SettingsSelectCell } from "#native/settings-cell/settings-select-cell";
import { SettingsSliderCell } from "#native/settings-cell/settings-slider-cell";
import { SettingsSwitchCell } from "#native/settings-cell/settings-switch-cell";

const state = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  views: [] as Record<string, unknown>[],
  radios: [] as Record<string, unknown>[],
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.radios.push(props);
      return createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    state.props[name] = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Slider: Object.assign(record("slider"), {
      Track: record("track"),
      Fill: record("fill"),
      Thumb: record("thumb"),
    }),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/icon/icon", async () => {
  const { createElement } = await import("react");
  return {
    Icon: (props: Record<string, unknown>) =>
      createElement("i", { "data-testid": `icon:${String(props["name"])}` }),
  };
});
vi.mock("#native/switch/switch", () => ({
  Switch: (props: Record<string, unknown>) => {
    state.props["switch"] = props;
    return null;
  },
}));
vi.mock("#native/inline-select/inline-select", () => ({
  InlineSelect: (props: Record<string, unknown>) => {
    state.props["select"] = props;
    return null;
  },
}));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

const within = (node: ReactNode) =>
  render(
    <DesignSystemContext value={{ locale: "en-US", direction: "ltr" } as DesignSystemState}>
      {node}
    </DesignSystemContext>,
  );
const propsOf = (name: string) => state.props[name] ?? {};
const frame = () => String(state.views[0]?.["className"]);

beforeEach(() => {
  state.props = {};
  state.views.length = 0;
  state.radios.length = 0;
  state.played.length = 0;
});

describe("SettingsCell (native)", () => {
  it("draws the icon, title, muted line, control and content, hiding the text from the reader", () => {
    render(
      <SettingsCell title="Wi-Fi" description="Home" icon="wifi" control={<b>on</b>}>
        <em>more</em>
      </SettingsCell>,
    );
    expect(screen.getByTestId("icon:wifi")).toBeTruthy();
    expect(screen.getByText("Wi-Fi")).toBeTruthy();
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("on")).toBeTruthy();
    expect(screen.getByText("more")).toBeTruthy();
    expect(state.views.find((view) => view["accessibilityElementsHidden"])).toMatchObject({
      importantForAccessibility: "no-hide-descendants",
    });
    expect(frame()).toContain("border-border bg-surface");
  });

  it("drops its frame in a group, dims when disabled and skips the icon and line it is not given", () => {
    render(
      <ItemCardGroupContext value>
        <SettingsCell title="Bare" isDisabled className="extra" />
      </ItemCardGroupContext>,
    );
    expect(frame()).not.toContain("bg-surface");
    expect(frame()).toContain("opacity-60");
    expect(frame()).toContain("extra");
    expect(screen.queryByTestId(/^icon:/)).toBeNull();
  });
});

describe("SettingsSwitchCell (native)", () => {
  it("names the Switch by the title, hints with the line and passes the state through", () => {
    const onChange = vi.fn();
    render(
      <SettingsSwitchCell title="Sync" description="Daily" value onChange={onChange} isDisabled />,
    );
    expect(propsOf("switch")).toMatchObject({
      accessibilityLabel: "Sync",
      accessibilityHint: "Daily",
      value: true,
      onChange,
      isDisabled: true,
    });
    expect(frame()).toContain("opacity-60");
  });

  it("gives no hint without a line", () => {
    render(<SettingsSwitchCell title="Sync" defaultValue />);
    expect(propsOf("switch")).not.toHaveProperty("accessibilityHint");
    expect(propsOf("switch")["defaultValue"]).toBe(true);
  });
});

describe("SettingsSelectCell (native)", () => {
  it("names the InlineSelect by the title and passes the items and state through", () => {
    const items = [{ id: "a", label: "A" }];
    const onChange = vi.fn();
    render(<SettingsSelectCell title="Theme" items={items} value="a" onChange={onChange} />);
    expect(propsOf("select")).toMatchObject({ label: "Theme", items, value: "a", onChange });
  });
});

describe("SettingsSliderCell (native)", () => {
  it("starts at the minimum, writes the value in the locale and holds its own value", () => {
    const onChange = vi.fn();
    within(<SettingsSliderCell title="Volume" minValue={10} onChange={onChange} />);
    expect(propsOf("slider")).toMatchObject({
      accessibilityLabel: "Volume",
      value: 10,
      minValue: 10,
      maxValue: 100,
      step: 1,
    });
    act(() => (propsOf("slider")["onChange"] as (next: number) => void)(1234));
    expect(onChange).toHaveBeenLastCalledWith(1234);
    expect(propsOf("slider")["value"]).toBe(1234);
    expect(screen.getByText("1,234")).toBeTruthy();
  });

  it("takes the first thumb of a range and keeps the owner's value when controlled", () => {
    const onChange = vi.fn();
    within(<SettingsSliderCell title="Volume" value={40} onChange={onChange} />);
    act(() => (propsOf("slider")["onChange"] as (next: number[]) => void)([70, 90]));
    expect(onChange).toHaveBeenLastCalledWith(70);
    expect(propsOf("slider")["value"]).toBe(40);
    act(() => (propsOf("slider")["onChange"] as (next: number[]) => void)([]));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("starts from defaultValue and formats with the given options", () => {
    within(
      <SettingsSliderCell
        title="Share"
        defaultValue={0.5}
        maxValue={1}
        step={0.1}
        formatOptions={{ style: "percent" }}
      />,
    );
    expect(screen.getByText("50%")).toBeTruthy();
  });
});

describe("SettingsColorCell (native)", () => {
  const swatches = ["#ffffff", "#000000"];

  it("is a radiogroup of swatches named by the title, none chosen and no preview at first", () => {
    render(<SettingsColorCell title="Accent" swatches={swatches} />);
    expect(state.views.find((view) => view["accessibilityRole"] === "radiogroup")).toMatchObject({
      accessibilityLabel: "Accent",
    });
    expect(state.radios.map((radio) => radio["accessibilityState"])).toEqual([
      { checked: false, disabled: false },
      { checked: false, disabled: false },
    ]);
    expect(state.views.some((view) => view["style"])).toBe(false);
  });

  it("chooses a swatch on press with a selection haptic, previews it and dots it in contrast", () => {
    const onChange = vi.fn();
    render(<SettingsColorCell title="Accent" swatches={swatches} onChange={onChange} />);
    act(() => screen.getAllByRole("button")[0]?.click());
    expect(onChange).toHaveBeenCalledWith("#ffffff");
    expect(state.played).toEqual(["selection"]);
    const styled = state.views.filter((view) => view["style"]).map((view) => view["style"]);
    expect(styled).toContainEqual({ backgroundColor: "#ffffff" });
    expect(styled).toContainEqual({ backgroundColor: "#000000" });
  });

  it("dots a dark swatch in white, keeps the owner's value and disables every swatch", () => {
    const onChange = vi.fn();
    render(
      <SettingsColorCell
        title="Accent"
        swatches={swatches}
        value="#000000"
        onChange={onChange}
        isDisabled
      />,
    );
    const styled = state.views.filter((view) => view["style"]).map((view) => view["style"]);
    expect(styled).toContainEqual({ backgroundColor: "#ffffff" });
    expect(state.radios.every((radio) => radio["disabled"] === true)).toBe(true);
    expect(
      state.radios.find((radio) => radio["accessibilityLabel"] === "#000000")?.[
        "accessibilityState"
      ],
    ).toEqual({ checked: true, disabled: true });
    act(() => screen.getAllByRole("button")[0]?.click());
    expect(onChange).toHaveBeenCalledWith("#ffffff");
  });

  it("starts from defaultValue with the house swatches", () => {
    render(<SettingsColorCell title="Accent" defaultValue="#123456" />);
    expect(state.radios.length).toBeGreaterThan(0);
    expect(state.views.find((view) => view["style"])).toMatchObject({
      style: { backgroundColor: "#123456" },
    });
  });
});
