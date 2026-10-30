/**
 * Stackra file contract:
 * Purpose: proves the native Popconfirm hands the Popover the question as its title with an arrow, draws the detail and
 *          the cancel and confirm buttons (red for danger), confirms and closes, cancels on the cancel button and on a
 *          dismissal, and keeps a pending confirm open until it resolves.
 * Boundary: the Popover, Text, Button and react-native's View are recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { Popconfirm } from "#native/popconfirm/popconfirm";

const state = vi.hoisted(() => ({
  popover: {} as Record<string, unknown>,
  buttons: [] as Record<string, unknown>[],
  texts: [] as unknown[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: ({ children }: { readonly children?: ReactNode }) => createElement("div", null, children),
  };
});
vi.mock("#native/popover/popover", async () => {
  const { createElement } = await import("react");
  return {
    Popover: (props: Record<string, unknown>) => {
      state.popover = props;
      return props["isOpen"] ? createElement("div", null, props["children"] as ReactNode) : null;
    },
  };
});
vi.mock("#native/text/text", () => ({
  Text: ({ children }: { readonly children?: ReactNode }) => {
    state.texts.push(children);
    return null;
  },
}));
vi.mock("#native/button/button", () => ({
  Button: (props: Record<string, unknown>) => {
    state.buttons.push(props);
    return null;
  },
}));

/** The last-drawn button whose words are `label`. */
const button = (label: string) =>
  [...state.buttons].reverse().find((props) => props["children"] === label) ?? {};
const pressButton = (label: string) => act(() => (button(label)["onPress"] as () => void)());

describe("Popconfirm (native)", () => {
  beforeEach(() => {
    state.popover = {};
    state.buttons = [];
    state.texts = [];
  });

  it("titles the popover with the question and draws detail and buttons", () => {
    render(
      <Popconfirm
        trigger={<span />}
        title="Delete this draft?"
        description="It cannot be restored."
        tone="danger"
        confirmLabel="Delete"
        defaultOpen
      />,
    );
    expect(state.popover).toMatchObject({
      title: "Delete this draft?",
      hasArrow: true,
      placement: "top",
    });
    expect(state.texts).toContain("It cannot be restored.");
    expect(button("Delete")).toMatchObject({ variant: "danger" });
    expect(button("Cancel")).toMatchObject({ variant: "ghost" });
  });

  it("confirms and closes, cancels on the button and on a dismissal", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Popconfirm
        trigger={<span />}
        title="Archive order?"
        defaultOpen
        onConfirm={onConfirm}
        onCancel={onCancel}
        onOpenChange={onOpenChange}
      />,
    );
    pressButton("Confirm");
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    act(() => (state.popover["onOpenChange"] as (open: boolean) => void)(true));
    pressButton("Cancel");
    act(() => (state.popover["onOpenChange"] as (open: boolean) => void)(false));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("keeps a pending confirm open until it resolves", async () => {
    let resolve: (() => void) | undefined;
    const onConfirm = () =>
      new Promise<void>((done) => {
        resolve = done;
      });
    render(
      <Popconfirm trigger={<span />} title="Refund order?" defaultOpen onConfirm={onConfirm} />,
    );
    pressButton("Confirm");
    expect(button("Confirm")).toMatchObject({ isLoading: true });
    act(() => (state.popover["onOpenChange"] as (open: boolean) => void)(false));
    expect(state.popover["isOpen"]).toBe(true);
    await act(async () => resolve?.());
    expect(state.popover["isOpen"]).toBe(false);
  });
});
