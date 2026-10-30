/**
 * Stackra file contract:
 * Purpose: proves the web ItemCard is a button only with onPress, and the SettingsSwitchCell names its switch by the title.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 2.1.1, 4.1.2; ADR 0022.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { ItemCard } from "#react/item-card/item-card";
import { ItemCardGroup } from "#react/item-card/item-card-group";
import { SettingsSwitchCell } from "#react/settings-cell/settings-switch-cell";

describe("ItemCard and SettingsCell (web)", () => {
  it("presses a pressable card and leaves a plain one inert", () => {
    const onPress = vi.fn();
    render(
      <ItemCardGroup title="Account">
        <ItemCard title="Profile" onPress={onPress} />
        <ItemCard title="Plan" end="Pro" />
      </ItemCardGroup>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Profile/ }));
    expect(onPress).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Plan/ })).toBeNull();
    expect(screen.getByRole("region", { name: "Account" })).toBeTruthy();
  });

  it("names the switch by the title", () => {
    const onChange = vi.fn();
    render(
      <SettingsSwitchCell title="Notifications" description="On every order" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("switch", { name: "Notifications" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
