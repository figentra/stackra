/**
 * Stackra file contract:
 * Purpose: proves the native CommandPalette: a top modal named "command palette" whose search narrows the sections
 *          and commands (each section titled by a header, each command a button with its icon and description), says
 *          when nothing matches, and on a press closes, clears the search and runs the command; open state is owned
 *          or its own.
 * Boundary: React Native does not render in vitest, so it and the house Modal, SearchField, Icon and Text are
 *           stand-ins that render plain DOM; what the palette reports is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { CommandSection } from "#contracts/types/command-section.type";
import { CommandPalette } from "#native/command-palette/command-palette";

const state = vi.hoisted(() => ({ modal: {} as Record<string, unknown> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  return {
    View: box,
    ScrollView: box,
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/modal/modal", async () => {
  const { createElement } = await import("react");
  return {
    Modal: Object.assign(
      (props: Record<string, unknown>) => {
        state.modal = props;
        return props["isOpen"] ? createElement("div", null, props["children"] as ReactNode) : null;
      },
      {
        Body: (props: Record<string, unknown>) =>
          createElement("div", null, props["children"] as ReactNode),
      },
    ),
  };
});
vi.mock("#native/search-field/search-field", async () => {
  const { createElement } = await import("react");
  return {
    SearchField: (props: Record<string, unknown>) =>
      createElement("input", {
        placeholder: props["placeholder"] as string,
        value: props["value"] as string,
        onChange: (event: { target: { value: string } }) =>
          (props["onChange"] as (value: string) => void)(event.target.value),
      }),
  };
});
vi.mock("#native/icon/icon", async () => {
  const { createElement } = await import("react");
  return {
    Icon: (props: Record<string, unknown>) =>
      createElement("i", { "data-testid": `icon:${String(props["name"])}` }),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement(
        "span",
        { role: props["accessibilityRole"] as string },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const K = "ui::command_palette.";
const SECTIONS: readonly CommandSection[] = [
  {
    id: "nav",
    title: "Go to",
    items: [
      { id: "home", label: "Home", icon: "house", description: "Start page" },
      { id: "orders", label: "Orders" },
    ],
  },
  { id: "act", title: "Actions", items: [{ id: "new", label: "New order", keywords: "create" }] },
];
const search = (text: string) =>
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });

beforeEach(() => {
  state.modal = {};
});

describe("CommandPalette (native)", () => {
  it("is a closed top modal until opened", () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette sections={SECTIONS} onAction={vi.fn()} onOpenChange={onOpenChange} />);
    expect(state.modal).toMatchObject({ isOpen: false, position: "top", label: `${K}label` });
    act(() => (state.modal["onOpenChange"] as (next: boolean) => void)(true));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByPlaceholderText(`${K}placeholder`)).toBeTruthy();
  });

  it("lists every section under a header with its commands", () => {
    render(
      <CommandPalette sections={SECTIONS} onAction={vi.fn()} defaultOpen placeholder="Find" />,
    );
    expect(screen.getByPlaceholderText("Find")).toBeTruthy();
    expect(screen.getAllByRole("header").map((header) => header.textContent)).toEqual([
      "Go to",
      "Actions",
    ]);
    expect(screen.getByTestId("icon:house")).toBeTruthy();
    expect(screen.getByText("Start page")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("narrows by keywords and says when nothing matches", () => {
    render(<CommandPalette sections={SECTIONS} onAction={vi.fn()} defaultOpen />);
    search("create");
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "New order",
    ]);
    search("zzz");
    expect(screen.getByText(`${K}empty`)).toBeTruthy();
  });

  it("closes, clears and runs a pressed command", () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        sections={SECTIONS}
        onAction={onAction}
        onOpenChange={onOpenChange}
        defaultOpen
      />,
    );
    search("ord");
    fireEvent.click(screen.getByText("Orders"));
    expect(onAction).toHaveBeenCalledWith("orders");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(state.modal["isOpen"]).toBe(false);
    act(() => (state.modal["onOpenChange"] as (next: boolean) => void)(true));
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
  });

  it("follows the owner's open state", () => {
    render(<CommandPalette sections={SECTIONS} onAction={vi.fn()} isOpen />);
    fireEvent.click(screen.getByText("Home"));
    expect(state.modal["isOpen"]).toBe(true);
  });
});
