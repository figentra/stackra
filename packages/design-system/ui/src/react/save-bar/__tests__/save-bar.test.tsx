/**
 * Stackra file contract:
 * Purpose: proves the web SaveBar draws nothing but an empty live region while clean, a named region with the
 *          message, Discard and Save while dirty, announces the message, keeps Save busy while its promise is pending
 *          (and after a rejection lets it go), honours `isSaving` and `isSaveDisabled`, and draws extra content.
 * Boundary: jsdom with real HeroUI and Motion; the slide and the shake are not timed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2, 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { SaveBar } from "#react/save-bar/save-bar";

const WORDS = {
  message: "Unsaved changes",
  saveLabel: "Save",
  discardLabel: "Discard",
  label: "Unsaved changes bar",
};

describe("SaveBar (web)", () => {
  it("is only an empty live region while the form is clean", () => {
    render(<SaveBar isDirty={false} onSave={vi.fn()} onDiscard={vi.fn()} {...WORDS} />);
    expect(screen.getByRole("status").textContent).toBe("");
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("shows a named region with the message and both buttons while dirty", () => {
    const onDiscard = vi.fn();
    render(
      <SaveBar isDirty onSave={vi.fn()} onDiscard={onDiscard} {...WORDS}>
        <span>extra</span>
      </SaveBar>,
    );
    expect(screen.getByRole("status").textContent).toBe("Unsaved changes");
    expect(screen.getByRole("region", { name: "Unsaved changes bar" })).toBeTruthy();
    expect(screen.getByText("extra")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it("keeps Save busy while the save runs, then frees it even after a failure", async () => {
    let fail: ((reason: unknown) => void) | undefined;
    const onSave = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          fail = reject;
        }),
    );
    render(<SaveBar isDirty onSave={onSave} onDiscard={vi.fn()} {...WORDS} />);
    const save = screen.getByRole("button", { name: "Save" });
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledOnce();
    expect(save.getAttribute("data-pending")).toBe("true");
    await act(async () => {
      fail?.(new Error("offline"));
      await Promise.resolve();
    });
    expect(save.hasAttribute("data-pending")).toBe(false);
  });

  it("shows busy for an outside save and refuses Save when disabled", () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <SaveBar isDirty isSaving onSave={onSave} onDiscard={vi.fn()} {...WORDS} />,
    );
    expect(screen.getByRole("button", { name: "Save" }).getAttribute("data-pending")).toBe("true");
    rerender(<SaveBar isDirty isSaveDisabled onSave={onSave} onDiscard={vi.fn()} {...WORDS} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).not.toHaveBeenCalled();
  });
});
