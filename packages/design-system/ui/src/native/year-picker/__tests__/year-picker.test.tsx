/**
 * Stackra file contract:
 * Purpose: proves the native YearPicker: a radiogroup (named by the catalogue unless given) of the years in bounds,
 *          ten either side of this year by default, written in the locale without grouping; a press plays a
 *          selection haptic, reports the year and checks it when uncontrolled; the Hijri calendar adds each year's
 *          Hijri years; disabled years cannot be pressed.
 * Boundary: React Native does not render in vitest, so it and the house Text and haptics are recording stand-ins
 *           that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC
 *          4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { YearPicker } from "#native/year-picker/year-picker";
import type { YearPickerProps } from "#native/year-picker/year-picker.props";

const state = vi.hoisted(() => ({
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
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const within = (props: YearPickerProps = {}) =>
  render(
    <DesignSystemContext value={{ locale: "en-US", direction: "ltr" } as DesignSystemState}>
      <YearPicker {...props} />
    </DesignSystemContext>,
  );
const checked = () =>
  state.radios
    .filter((radio) => (radio["accessibilityState"] as { checked: boolean }).checked)
    .map((radio) => radio["className"]);

beforeEach(() => {
  state.views.length = 0;
  state.radios.length = 0;
  state.played.length = 0;
});

describe("YearPicker (native)", () => {
  it("offers ten years either side of this one under the catalogue name", () => {
    within();
    const year = new Date().getFullYear();
    expect(state.views[0]).toMatchObject({
      accessibilityRole: "radiogroup",
      accessibilityLabel: "ui::year_picker.label",
    });
    expect(state.radios).toHaveLength(21);
    expect(screen.getByText(String(year - 10))).toBeTruthy();
    expect(screen.getByText(String(year + 10))).toBeTruthy();
  });

  it("checks a pressed year with a haptic and reports it", () => {
    const onChange = vi.fn();
    within({ minYear: 2000, maxYear: 2002, onChange, label: "Year" });
    expect(state.views[0]?.["accessibilityLabel"]).toBe("Year");
    expect(checked()).toEqual([]);
    state.radios.length = 0;
    fireEvent.click(screen.getByText("2001"));
    expect(onChange).toHaveBeenCalledWith(2001);
    expect(state.played).toEqual(["selection"]);
    expect(checked()).toHaveLength(1);
    expect(String(checked()[0])).toContain("bg-accent");
  });

  it("keeps the owner's year and adds the Hijri years", () => {
    const onChange = vi.fn();
    within({
      minYear: 2026,
      maxYear: 2026,
      value: 2026,
      onChange,
      calendar: "islamic-umalqura",
    });
    expect(screen.getByText(/144[78]/)).toBeTruthy();
    expect(checked()).toHaveLength(1);
  });

  it("starts from defaultValue and disables every year", () => {
    within({ minYear: 2010, maxYear: 2011, defaultValue: 2010, isDisabled: true });
    expect(state.radios.every((radio) => radio["disabled"] === true)).toBe(true);
    expect(String(state.radios[1]?.["className"])).toContain("opacity-50");
    expect(checked()).toHaveLength(1);
  });
});
