/**
 * Stackra file contract:
 * Purpose: proves the alert-dialog page titles the document, lists every sample under its section, opens each tone's
 *          dialog named by its title with the tone's mark, answers in the status line on confirm and cancel, and that a
 *          press outside answers only on the sample that turns it on and Escape only on the one that does not turn it
 *          off.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-105
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { AlertDialog } from "#src/routes/alert-dialog/alert-dialog";
import { AlertDialogRoute } from "#src/routes/alert-dialog/alert-dialog.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <AlertDialog />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
/** A press on the backdrop, outside the dialog; both event families, as React Aria listens to whichever exists. */
const pressOutside = () => {
  const backdrop = document.querySelector('[data-slot="alert-dialog-backdrop"]');
  if (!backdrop) throw new Error("no backdrop");
  for (const type of ["pointerDown", "mouseDown", "pointerUp", "mouseUp"] as const)
    fireEvent[type](backdrop);
};
const open = (name: string) => act(() => screen.getByRole("button", { name }).click());

describe("AlertDialog page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /alert-dialog under Overlays", () => {
    renderPage();
    expect(AlertDialogRoute.path).toBe("/alert-dialog");
    expect(AlertDialogRoute.category).toBe("Overlays");
    expect(screen.getByRole("heading", { level: 1, name: "Alert dialog" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Alert dialog · Stackra Playground");
  });

  it("lists every sample under its section and opens none at first", () => {
    renderPage();
    expect(section("Tones").getAllByRole("button")).toHaveLength(5);
    expect(section("Icons").getAllByRole("button")).toHaveLength(2);
    expect(section("Dismissal").getAllByRole("button")).toHaveLength(2);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(section("Last answer").getByRole("status").textContent).toBe("No answer yet.");
  });

  it.each([
    ["Default tone", "Publish this page?", "default"],
    ["Accent tone", "Invite the whole team?", "accent"],
    ["Success tone", "Mark the order as shipped?", "success"],
    ["Warning tone", "Close the project with open tasks?", "warning"],
    ["Danger tone", "Delete this project?", "danger"],
  ])("opens the %s dialog with the tone's mark", (trigger, title, tone) => {
    renderPage();
    open(trigger);
    const dialog = screen.getByRole("alertdialog", { name: title });
    expect(dialog.querySelector('[data-slot="alert-dialog-icon"]')?.className).toContain(
      `alert-dialog__icon--${tone}`,
    );
    expect(dialog.querySelector('[data-slot="alert-dialog-icon"] svg')).toBeTruthy();
  });

  it("draws an icon of its own, and none", () => {
    renderPage();
    open("Custom icon");
    expect(
      screen
        .getByRole("alertdialog")
        .querySelector('[data-slot="alert-dialog-icon"] svg.lucide-trash'),
    ).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Keep it" }).click());
    open("No icon");
    expect(
      screen.getByRole("alertdialog").querySelector('[data-slot="alert-dialog-icon"]'),
    ).toBeNull();
  });

  it("answers in the status line on confirm and on cancel", () => {
    renderPage();
    open("Danger tone");
    act(() => screen.getByRole("button", { name: "Delete project" }).click());
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Danger tone: confirmed.");
    open("Danger tone");
    act(() => screen.getByRole("button", { name: "Keep project" }).click());
    expect(screen.getByRole("status").textContent).toBe("Danger tone: cancelled.");
  });

  it("answers a press outside only on the sample that turns it on", () => {
    renderPage();
    open("Danger tone");
    pressOutside();
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Keep project" }).click());
    open("Press outside answers");
    pressOutside();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Press outside answers: cancelled.");
  });

  it("answers Escape on every sample but the one that turns it off", () => {
    renderPage();
    open("Danger tone");
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Danger tone: cancelled.");
    open("Escape disabled");
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(screen.getByRole("alertdialog", { name: "Accept the new terms?" })).toBeTruthy();
  });
});
