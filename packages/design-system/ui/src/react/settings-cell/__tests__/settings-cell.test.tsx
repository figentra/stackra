/**
 * Stackra file contract:
 * Purpose: proves the settings cells: the base cell names its control by title and description and flattens inside
 *          an item-card group; the switch, select, slider and colour cells report changes, keep their own value
 *          when uncontrolled, follow `value` when controlled, and refuse input while disabled.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ItemCardGroupContext } from "#react/item-card/item-card-group-context";
import { SettingsCell } from "#react/settings-cell/settings-cell";
import type { SettingsCellIds } from "#react/settings-cell/settings-cell-ids.type";
import { SettingsColorCell } from "#react/settings-cell/settings-color-cell";
import { SettingsSelectCell } from "#react/settings-cell/settings-select-cell";
import { SettingsSliderCell } from "#react/settings-cell/settings-slider-cell";
import { SettingsSwitchCell } from "#react/settings-cell/settings-switch-cell";

describe("SettingsCell (web)", () => {
  it("renders title, description, icon and a static control", () => {
    const { container } = render(
      <SettingsCell
        title="Sync"
        description="Every hour"
        icon="check"
        control={<button type="button">Go</button>}
      >
        <p>Body</p>
      </SettingsCell>,
    );
    expect(screen.getByText("Sync")).toBeTruthy();
    expect(screen.getByText("Every hour")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go" })).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
    expect(container.querySelector("[aria-hidden]")).not.toBeNull();
    expect((container.firstChild as HTMLElement).className).toContain("border");
  });

  it("hands the title and description ids to a control callback and drops its border inside a group", () => {
    const control = vi.fn((_ids: SettingsCellIds) => <span>ctl</span>);
    const { container } = render(
      <ItemCardGroupContext value>
        <SettingsCell title="A" description="B" isDisabled control={control} />
      </ItemCardGroupContext>,
    );
    const ids = control.mock.calls[0]?.[0];
    expect(document.getElementById(ids?.title ?? "")?.textContent).toBe("A");
    expect(document.getElementById(ids?.description ?? "")?.textContent).toBe("B");
    const root = container.firstChild as HTMLElement;
    expect(root.className).not.toContain("border-border");
    expect(root.className).toContain("opacity-(--opacity-muted)");
  });

  it("leaves the description id out when there is none", () => {
    const control = vi.fn((_ids: SettingsCellIds) => null);
    render(<SettingsCell title="A" control={control} />);
    expect(control.mock.calls[0]?.[0]?.title).toBeTruthy();
    expect(control.mock.calls[0]?.[0]?.description).toBeUndefined();
  });
});

describe("SettingsSwitchCell (web)", () => {
  it("is a switch named by the title, described by the description, and reports changes", () => {
    const onChange = vi.fn();
    render(<SettingsSwitchCell title="Alerts" description="Push only" onChange={onChange} />);
    const control = screen.getByRole("switch", { name: "Alerts" });
    expect(
      document.getElementById(control.getAttribute("aria-describedby") ?? "")?.textContent,
    ).toBe("Push only");
    fireEvent.click(control);
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it("is disabled with the cell", () => {
    render(<SettingsSwitchCell title="Alerts" isDisabled />);
    expect((screen.getByRole("switch", { name: "Alerts" }) as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});

describe("SettingsSelectCell (web)", () => {
  it("shows the chosen option as an inline select", () => {
    render(
      <SettingsSelectCell
        title="Theme"
        items={[
          { id: "light", label: "Light" },
          { id: "dark", label: "Dark" },
        ]}
        defaultValue="dark"
      />,
    );
    expect(screen.getByRole("button", { name: /Dark/ })).toBeTruthy();
  });
});

describe("SettingsSliderCell (web)", () => {
  it("formats the current value, steps with the keyboard and reports it", () => {
    const onChange = vi.fn();
    render(<SettingsSliderCell title="Volume" defaultValue={40} step={10} onChange={onChange} />);
    expect(screen.getByText("40")).toBeTruthy();
    const thumb = screen.getByRole("slider");
    act(() => thumb.focus());
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(50);
    expect(screen.getByText("50")).toBeTruthy();
  });

  it("follows value when controlled and starts at the minimum by default", () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <SettingsSliderCell title="Volume" value={10} onChange={onChange} />,
    );
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(11);
    expect(screen.getByText("10")).toBeTruthy();
    unmount();
    render(<SettingsSliderCell title="Volume" minValue={5} />);
    expect(screen.getByText("5")).toBeTruthy();
  });
});

describe("SettingsColorCell (web)", () => {
  const swatches = ["#ffffff", "#112233"] as const;

  it("selects a swatch, shows its dot, and reports it", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SettingsColorCell title="Accent" swatches={swatches} onChange={onChange} />,
    );
    expect(container.querySelector('span[style*="background-color"]')).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "#112233" }));
    expect(onChange).toHaveBeenLastCalledWith("#112233");
    expect((screen.getByRole("radio", { name: "#112233" }) as HTMLInputElement).checked).toBe(true);
    expect(container.querySelector('span[style*="background-color"]')).not.toBeNull();
  });

  it("follows value when controlled, marks a light swatch with a dark check, and refuses input while disabled", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SettingsColorCell title="Accent" swatches={swatches} value="#ffffff" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "#112233" }));
    expect(onChange).toHaveBeenLastCalledWith("#112233");
    expect((screen.getByRole("radio", { name: "#ffffff" }) as HTMLInputElement).checked).toBe(true);
    rerender(
      <SettingsColorCell title="Accent" swatches={swatches} defaultValue="#ffffff" isDisabled />,
    );
    expect((screen.getByRole("radio", { name: "#112233" }) as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});
