/**
 * Stackra file contract:
 * Purpose: proves the web TextField and TextArea gain Tamo's menu only on plain text with a slot, run a text action into a
 *          draft review whose Accept changes the field, offer Undo, and show the review marker of a form fill.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";
import { TamoContext } from "#react/hooks/tamo-context";
import { TamoReviewContext } from "#react/hooks/tamo-review-context";
import { TextArea } from "#react/text-area/text-area";
import { TextField } from "#react/text-field/text-field";

/** A slot that answers every task with `answer` (or never, with `pending`). */
function slotOf(run: TamoSlot["run"], overrides: Partial<TamoSlot> = {}): TamoSlot {
  return {
    isEnabled: () => true,
    run,
    panel: { isOpen: false, question: undefined, open: vi.fn(), close: vi.fn() },
    ...overrides,
  };
}

describe("TextField with Tamo (web)", () => {
  it("has no Tamo menu without a slot, on a password, or with ai off", () => {
    const slot = slotOf(vi.fn());
    render(
      <TamoContext.Provider value={slot}>
        <TextField label="Password" type="password" />
        <TextField label="Note" ai={false} />
      </TamoContext.Provider>,
    );
    expect(screen.queryByRole("button", { name: "Ask Tamo" })).toBeNull();
  });

  it("runs an action, reviews the draft and accepts it, then undoes it", async () => {
    const run = vi.fn(async (..._args: unknown[]) => "Hello there.");
    const onChange = vi.fn();
    render(
      <TamoContext.Provider value={slotOf(run as unknown as TamoSlot["run"])}>
        <TextField
          label="Greeting"
          name="greeting"
          defaultValue="hello there"
          onChange={onChange}
        />
      </TamoContext.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ask Tamo" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Fix grammar" }));
    expect(run.mock.calls[0]?.[1]).toMatchObject({
      text: "hello there",
      action: "fix_grammar",
      field: "greeting",
    });
    fireEvent.click(await screen.findByRole("button", { name: "Accept" }));
    expect(onChange).toHaveBeenLastCalledWith("Hello there.");
    expect((screen.getByRole("textbox", { name: "Greeting" }) as HTMLInputElement).value).toBe(
      "Hello there.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onChange).toHaveBeenLastCalledWith("hello there");
  });

  it("marks a field a form fill put text in", () => {
    render(
      <TamoReviewContext.Provider value={new Set(["company"])}>
        <TextArea label="Company" name="company" />
      </TamoReviewContext.Provider>,
    );
    expect(screen.getByText("Filled by Tamo, check it")).toBeTruthy();
  });
});
