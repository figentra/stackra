/**
 * Stackra file contract:
 * Purpose: proves the web LeaveConfirmation: `confirmLeave` resolves true at once while `when` is false, otherwise
 *          opens a dialog named by the title and described by the description that resolves true on Discard and false
 *          on Stay or Escape, starts focus on Stay, is not decided by a press outside, and makes the browser ask before
 *          unload only while `when` is true, taking its listener away when `when` turns false or the component unmounts.
 * Boundary: jsdom with real HeroUI and React Aria; `beforeunload` is dispatched as a cancelable event, since jsdom
 *           has no tab to close.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 3.3.4; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-104
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CircleAlert } from "lucide-react";
import { useRef } from "react";

import type { LeaveConfirmationContractProps } from "#contracts/types/leave-confirmation-contract-props.type";
import type { LeaveConfirmationHandle } from "#contracts/types/leave-confirmation-handle.type";
import { LeaveConfirmation } from "#react/leave-confirmation/leave-confirmation";
import type { LeaveConfirmationProps } from "#react/leave-confirmation/leave-confirmation.props";

const registry = defineIconRegistry({ "circle-alert": CircleAlert });

/** A page with a Leave button that asks through the handle, as a router blocker's effect would. */
function Page({
  when,
  onAnswer,
}: {
  readonly when: boolean;
  readonly onAnswer: (answer: boolean) => void;
}) {
  const leave = useRef<LeaveConfirmationHandle>(null);
  return (
    <IconRegistryProvider registry={registry}>
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
        description="Your edits to this page will be lost."
        stayLabel="Stay"
        discardLabel="Discard"
      />
    </IconRegistryProvider>
  );
}

const press = async (name: string) => {
  await act(async () => screen.getByRole("button", { name }).click());
};

/** Dispatches `beforeunload` and says whether the page asked the browser to hold the user back. */
const isHeldBack = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

describe("LeaveConfirmation (web)", () => {
  it("lets the user leave at once, and draws nothing, while nothing is unsaved", async () => {
    const onAnswer = vi.fn();
    render(<Page when={false} onAnswer={onAnswer} />);
    await press("Leave");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true));
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("asks, named by the title and described by the description, while there is unsaved work", async () => {
    render(<Page when onAnswer={vi.fn()} />);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await press("Leave");
    const dialog = screen.getByRole("alertdialog", { name: "Discard unsaved changes?" });
    const describedBy = dialog.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy)?.textContent).toBe(
      "Your edits to this page will be lost.",
    );
    // React Aria moves focus into the dialog after it mounts, not within the press itself.
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Stay" })),
    );
    expect(dialog.querySelector("svg.lucide-circle-alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Discard" }).className).toContain("button--danger");
  });

  it("resolves true on Discard", async () => {
    const onAnswer = vi.fn();
    render(<Page when onAnswer={onAnswer} />);
    await press("Leave");
    await press("Discard");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true));
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("resolves false on Stay and on Escape", async () => {
    const onAnswer = vi.fn();
    render(<Page when onAnswer={onAnswer} />);
    await press("Leave");
    await press("Stay");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith(false));
    await press("Leave");
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    });
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(2));
    expect(onAnswer).toHaveBeenLastCalledWith(false);
  });

  it("is not decided by a press outside", async () => {
    const onAnswer = vi.fn();
    render(<Page when onAnswer={onAnswer} />);
    await press("Leave");
    const backdrop = document.querySelector('[data-slot="alert-dialog-backdrop"]');
    if (!backdrop) throw new Error("no backdrop");
    for (const type of ["pointerDown", "mouseDown", "pointerUp", "mouseUp"] as const)
      fireEvent[type](backdrop);
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeTruthy();
  });

  it("makes the browser ask before unload only while there is unsaved work", () => {
    const { rerender, unmount } = render(<Page when={false} onAnswer={vi.fn()} />);
    expect(isHeldBack()).toBe(false);
    rerender(<Page when onAnswer={vi.fn()} />);
    expect(isHeldBack()).toBe(true);
    rerender(<Page when={false} onAnswer={vi.fn()} />);
    expect(isHeldBack()).toBe(false);
    rerender(<Page when onAnswer={vi.fn()} />);
    expect(isHeldBack()).toBe(true);
    unmount();
    expect(isHeldBack()).toBe(false);
  });

  it("takes a ref with the handle and nothing else", () => {
    expectTypeOf<LeaveConfirmationProps>().toExtend<LeaveConfirmationContractProps>();
    // @ts-expect-error the words of the dialog are the app's, so the title is required
    void (<LeaveConfirmation when stayLabel="Stay" discardLabel="Discard" />);
    // @ts-expect-error `when` says whether there is unsaved work, so it is required
    void (<LeaveConfirmation title="t" stayLabel="Stay" discardLabel="Discard" />);
  });
});
