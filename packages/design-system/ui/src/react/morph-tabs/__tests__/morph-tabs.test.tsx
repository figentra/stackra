/**
 * Stackra file contract:
 * Purpose: proves the web MorphTabs: a labelled radio group of icon tabs named by their labels, starting on the first
 *          or the default one, selecting by click and arrow key and reporting the key, following `selectedKey` when
 *          controlled, and refusing a disabled tab or a disabled group.
 * Boundary: jsdom with real React Aria; the label's grow animation is CSS, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { MorphTabs } from "#react/morph-tabs/morph-tabs";

const ITEMS = [
  { id: "home", label: "Home", icon: "check" as const },
  { id: "search", label: "Search" },
  { id: "off", label: "Off", isDisabled: true },
];
const radio = (name: string) => screen.getByRole("radio", { name }) as HTMLInputElement;

describe("MorphTabs (web)", () => {
  it("starts on the first tab and selects by click and arrow key", () => {
    const onSelectionChange = vi.fn();
    render(<MorphTabs label="Views" items={ITEMS} onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole("radiogroup", { name: "Views" })).toBeTruthy();
    expect(radio("Home").checked).toBe(true);
    fireEvent.click(radio("Search"));
    expect(onSelectionChange).toHaveBeenLastCalledWith("search");
    expect(radio("Search").checked).toBe(true);
    act(() => radio("Search").focus());
    fireEvent.keyDown(radio("Search"), { key: "ArrowLeft" });
    expect(onSelectionChange).toHaveBeenLastCalledWith("home");
    expect(radio("Off").disabled).toBe(true);
  });

  it("follows selectedKey and defaultSelectedKey, and is disabled as a whole", () => {
    const onSelectionChange = vi.fn();
    const { unmount } = render(
      <MorphTabs
        label="Views"
        items={ITEMS}
        selectedKey="search"
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.click(radio("Home"));
    expect(onSelectionChange).toHaveBeenLastCalledWith("home");
    expect(radio("Search").checked).toBe(true);
    unmount();
    const view = render(
      <MorphTabs label="Views" items={ITEMS} defaultSelectedKey="search" isDisabled />,
    );
    expect(radio("Search").checked).toBe(true);
    expect(radio("Home").disabled).toBe(true);
    expect((view.container.firstChild as HTMLElement).className).toContain(
      "opacity-(--disabled-opacity)",
    );
  });

  it("renders with no items", () => {
    render(<MorphTabs label="Views" items={[]} />);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });
});
