/**
 * Stackra file contract:
 * Purpose: proves the native TocRail: an "On this page" list named by the label (or the catalogue) whose entries are
 *          links, the current one (the first without `activeId`) selected and marked at the start edge, third-level
 *          entries indented, a press calls onSelect; `floating` puts the list in a popover behind a round button.
 * Boundary: React Native does not render in vitest, so it and the house Popover, IconButton and Text are stand-ins
 *           that render plain DOM; what each entry is handed is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.4.5; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { TocRail } from "#native/toc-rail/toc-rail";

const state = vi.hoisted(() => ({
  entries: [] as Record<string, unknown>[],
  popover: undefined as Record<string, unknown> | undefined,
  trigger: undefined as Record<string, unknown> | undefined,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { "aria-label": props["accessibilityLabel"] as string },
        props["children"] as ReactNode,
      ),
    Pressable: (props: Record<string, unknown>) => {
      state.entries.push(props);
      return createElement(
        "a",
        { role: "link", onClick: props["onPress"] },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/popover/popover", async () => {
  const { createElement } = await import("react");
  return {
    Popover: (props: Record<string, unknown>) => {
      state.popover = props;
      return createElement(
        "div",
        null,
        props["trigger"] as ReactNode,
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Record<string, unknown>) => {
    state.trigger = props;
    return null;
  },
}));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const ITEMS = [
  { id: "intro", label: "Intro", level: 2 as const },
  { id: "setup", label: "Setup", level: 3 as const },
];

beforeEach(() => {
  state.entries.length = 0;
  state.popover = undefined;
  state.trigger = undefined;
});

describe("TocRail (native)", () => {
  it("lists the sections as links with the first current by default", () => {
    render(<TocRail items={ITEMS} />);
    expect(screen.getByLabelText("ui::toc_rail.label")).toBeTruthy();
    expect(state.entries.map((entry) => entry["accessibilityState"])).toEqual([
      { selected: true },
      { selected: false },
    ]);
    expect(state.entries[0]?.["className"]).toContain("ps-3");
    expect(state.entries[0]?.["className"]).toContain("border-accent");
    expect(state.entries[1]?.["className"]).toContain("ps-6");
    expect(state.entries[1]?.["className"]).toContain("border-transparent");
    expect(state.popover).toBeUndefined();
    fireEvent.click(screen.getByText("Setup"));
  });

  it("marks the active section and reports a press", () => {
    const onSelect = vi.fn();
    render(
      <TocRail items={ITEMS} activeId="setup" onSelect={onSelect} label="Contents" className="x" />,
    );
    expect(screen.getByLabelText("Contents")).toBeTruthy();
    expect(state.entries[1]?.["accessibilityState"]).toEqual({ selected: true });
    fireEvent.click(screen.getByText("Intro"));
    expect(onSelect).toHaveBeenCalledWith("intro");
  });

  it("floats the list in a popover behind a round button", () => {
    render(<TocRail items={ITEMS} variant="floating" />);
    expect(state.popover).toMatchObject({ placement: "top", align: "end" });
    expect(state.trigger).toMatchObject({ icon: "list", label: "ui::toc_rail.open" });
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
