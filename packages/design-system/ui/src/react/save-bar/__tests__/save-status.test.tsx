/**
 * Stackra file contract:
 * Purpose: proves the web SaveStatus draws each autosave state's words in InlineLoading's live region.
 * Boundary: jsdom with real HeroUI and Motion; only end states are checked.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { SaveStatus } from "#react/save-bar/save-status";

const LABELS = {
  savingLabel: "Saving",
  savedLabel: "Saved at 14:05",
  failedLabel: "Couldn't save",
};

describe("SaveStatus (web)", () => {
  it("maps saving, saved and failed to loading, success and error", async () => {
    const { rerender } = render(<SaveStatus state="idle" {...LABELS} />);
    expect(screen.getByRole("status").getAttribute("data-status")).toBe("idle");
    rerender(<SaveStatus state="saving" {...LABELS} />);
    expect(screen.getByRole("status").getAttribute("data-status")).toBe("loading");
    rerender(<SaveStatus state="saved" {...LABELS} />);
    expect(await screen.findByText("Saved at 14:05")).toBeTruthy();
    rerender(<SaveStatus state="failed" {...LABELS} />);
    expect(await screen.findByText("Couldn't save")).toBeTruthy();
    expect(screen.getByRole("status").getAttribute("data-status")).toBe("error");
  });
});
