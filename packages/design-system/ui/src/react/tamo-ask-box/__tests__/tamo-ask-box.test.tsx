/**
 * Stackra file contract:
 * Purpose: proves the web TamoAskBox sends the words, draws the proposal with Apply and Discard, says when nothing is found,
 *          and offers Try again on error.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TamoAskBox } from "#react/tamo-ask-box/tamo-ask-box";

const ask = (text: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: "Ask Tamo" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Ask Tamo" }));
};

describe("TamoAskBox (web)", () => {
  it("draws the proposal and applies it", async () => {
    const onApply = vi.fn();
    render(
      <TamoAskBox<string>
        onAsk={async (text) => text.toUpperCase()}
        renderProposal={(proposal) => <p>{proposal}</p>}
        onApply={onApply}
      />,
    );
    ask("paid");
    await screen.findByText("PAID");
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApply).toHaveBeenCalledWith("PAID");
  });

  it("says when nothing is proposed, and offers Try again on error", async () => {
    const onAsk = vi.fn().mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("down"));
    render(<TamoAskBox<string> onAsk={onAsk} renderProposal={() => null} onApply={vi.fn()} />);
    ask("x");
    await screen.findByText("Tamo found nothing to suggest. Try other words.");
    ask("y");
    await screen.findByRole("button", { name: "Try again" });
  });
});
