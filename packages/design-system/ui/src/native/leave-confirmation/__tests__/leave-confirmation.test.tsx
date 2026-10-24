/**
 * Stackra file contract:
 * Purpose: proves the native LeaveConfirmation: `confirmLeave` resolves true at once while `when` is false, otherwise
 *          opens the AlertDialog with the app's words, the danger tone, and Stay and Discard in that order, and
 *          resolves true on Discard and false on Stay or when the dialog asks to close (the back button); it adds no
 *          browser listener, since native has no unload.
 * Boundary: React Native does not render in vitest, so the native AlertDialog is replaced by a stand-in that renders
 *           plain DOM and follows the real one's contract (confirm calls `onConfirm` then `onOpenChange(false)`,
 *           cancel and the back button call `onOpenChange(false)`); the real dialog is proved in its own test.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0312; WCAG 2.2 SC 3.3.4; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-104
import { act, render, screen } from "@testing-library/react";
import { useRef, type ReactNode } from "react";

import type { LeaveConfirmationHandle } from "#contracts/types/leave-confirmation-handle.type";
import { LeaveConfirmation } from "#native/leave-confirmation/leave-confirmation";

/** The props the dialog stand-in was last handed. */
const received = vi.hoisted(() => ({ dialog: {} as Record<string, unknown> }));

vi.mock("#native/alert-dialog/alert-dialog", async () => {
  const { createElement } = await import("react");
  return {
    AlertDialog: (props: Record<string, unknown>) => {
      received.dialog = props;
      if (!props["isOpen"]) return null;
      const close = props["onOpenChange"] as (next: boolean) => void;
      return createElement(
        "section",
        { role: "alertdialog" },
        createElement("h2", null, props["title"] as ReactNode),
        createElement("p", null, props["description"] as ReactNode),
        createElement("button", { onClick: () => close(false) }, props["cancelLabel"] as string),
        createElement(
          "button",
          {
            onClick: () => {
              (props["onConfirm"] as () => void)();
              close(false);
            },
          },
          props["confirmLabel"] as string,
        ),
      );
    },
  };
});

/** A screen with a Leave button that asks through the handle, as a navigation listener would. */
function Screen({
  when,
  onAnswer,
}: {
  readonly when: boolean;
  readonly onAnswer: (answer: boolean) => void;
}) {
  const leave = useRef<LeaveConfirmationHandle>(null);
  return (
    <>
      <button
        type="button"
        onClick={async () => onAnswer((await leave.current?.confirmLeave()) ?? false)}
      >
        Leave
      </button>
      <LeaveConfirmation
        ref={leave}
        when={when}
        title="Discard unsaved changes?"
        description="Your edits to this screen will be lost."
        stayLabel="Stay"
        discardLabel="Discard"
      />
    </>
  );
}

const press = async (name: string) => {
  await act(async () => screen.getByRole("button", { name }).click());
};

describe("LeaveConfirmation (native)", () => {
  it("lets the user leave at once, and draws nothing, while nothing is unsaved", async () => {
    const onAnswer = vi.fn();
    render(<Screen when={false} onAnswer={onAnswer} />);
    await press("Leave");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true));
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("asks with the app's words in the danger tone, Stay before Discard", async () => {
    render(<Screen when onAnswer={vi.fn()} />);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await press("Leave");
    expect(screen.getByRole("heading", { name: "Discard unsaved changes?" })).toBeTruthy();
    expect(screen.getByText("Your edits to this screen will be lost.")).toBeTruthy();
    expect(received.dialog).toMatchObject({
      tone: "danger",
      cancelLabel: "Stay",
      confirmLabel: "Discard",
    });
    expect(
      screen
        .getAllByRole("button")
        .map((node) => node.textContent)
        .slice(1),
    ).toEqual(["Stay", "Discard"]);
  });

  it("resolves true on Discard", async () => {
    const onAnswer = vi.fn();
    render(<Screen when onAnswer={onAnswer} />);
    await press("Leave");
    await press("Discard");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true));
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("resolves false on Stay and when the dialog asks to close", async () => {
    const onAnswer = vi.fn();
    render(<Screen when onAnswer={onAnswer} />);
    await press("Leave");
    await press("Stay");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith(false));
    await press("Leave");
    // The back button reaches the component as the dialog's own request to close.
    await act(async () => (received.dialog["onOpenChange"] as (next: boolean) => void)(false));
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(2));
    expect(onAnswer).toHaveBeenLastCalledWith(false);
  });

  it("adds no unload listener, since native has none", () => {
    const add = vi.spyOn(globalThis, "addEventListener");
    render(<Screen when onAnswer={vi.fn()} />);
    expect(add.mock.calls.filter(([type]) => type === "beforeunload")).toEqual([]);
    add.mockRestore();
  });
});
