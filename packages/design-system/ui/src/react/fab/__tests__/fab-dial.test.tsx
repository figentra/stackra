/**
 * Stackra file contract:
 * Purpose: proves the web `Fab`'s actions: a single Fab runs `onPress` and claims no popup; a speed dial's button
 *          controls the list it opens, a chosen action runs its own `onPress` and `onAction` and closes the dial,
 *          Escape closes it and puts focus back on the main button, a controlled dial follows `isOpen` and reports
 *          through `onOpenChange`, an extended Fab shows its label as text, and a disabled one does nothing.
 * Boundary: jsdom with real HeroUI and Motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1 and 4.1.2; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Fab } from "#react/fab/fab";

const press = (element: HTMLElement) => act(() => element.click());

const main = () => screen.getByRole("button", { name: "Create" });

describe("Fab dial (web)", () => {
  it("runs onPress for a single action and claims no popup", () => {
    const onPress = vi.fn();
    render(<Fab label="Create" onPress={onPress} />);
    press(main());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(main().hasAttribute("aria-expanded")).toBe(false);
    expect(main().hasAttribute("aria-controls")).toBe(false);
  });

  it("opens a list it controls, and a chosen action runs and closes the dial", () => {
    const onNote = vi.fn();
    const onAction = vi.fn();
    render(
      <Fab
        label="Create"
        actions={[
          { id: "note", label: "Note", icon: "file", onPress: onNote },
          { id: "photo", label: "Photo", icon: "image" },
        ]}
        onAction={onAction}
      />,
    );
    expect(main().getAttribute("aria-expanded")).toBe("false");
    press(main());
    expect(main().getAttribute("aria-expanded")).toBe("true");
    const list = document.getElementById(main().getAttribute("aria-controls") ?? "");
    expect(list?.tagName).toBe("UL");
    press(screen.getByRole("button", { name: "Note" }));
    expect(onNote).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith("note");
    expect(main().getAttribute("aria-expanded")).toBe("false");
    press(main());
    press(screen.getByRole("button", { name: "Photo" }));
    expect(onAction).toHaveBeenLastCalledWith("photo");
  });

  it("closes on Escape and puts focus back on the main button", () => {
    render(
      <Fab label="Create" actions={[{ id: "note", label: "Note", icon: "file" }]} defaultOpen />,
    );
    const note = screen.getByRole("button", { name: "Note" });
    note.focus();
    fireEvent.keyDown(note, { key: "Escape" });
    expect(main().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(main());
    // Escape on a closed dial changes nothing.
    fireEvent.keyDown(main(), { key: "Escape" });
    expect(main().getAttribute("aria-expanded")).toBe("false");
  });

  it("follows a controlled isOpen and reports changes", () => {
    const onOpenChange = vi.fn();
    const actions = [{ id: "note", label: "Note", icon: "file" }] as const;
    const { rerender } = render(
      <Fab label="Create" actions={actions} isOpen={false} onOpenChange={onOpenChange} />,
    );
    press(main());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(main().getAttribute("aria-expanded")).toBe("false");
    rerender(<Fab label="Create" actions={actions} isOpen onOpenChange={onOpenChange} />);
    expect(screen.getByRole("button", { name: "Note" })).toBeTruthy();
  });

  it("shows an extended Fab's label as text", () => {
    render(
      <Fab
        label="Create"
        isExtended
        icon="pencil"
        actions={[{ id: "a", label: "A", icon: "file" }]}
      />,
    );
    expect(main().textContent).toContain("Create");
    press(main());
    expect(main().getAttribute("aria-expanded")).toBe("true");
  });

  it("does nothing while disabled", () => {
    const onPress = vi.fn();
    render(<Fab label="Create" onPress={onPress} isDisabled />);
    press(main());
    expect(onPress).not.toHaveBeenCalled();
  });
});
