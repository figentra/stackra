/**
 * Stackra file contract:
 * Purpose: proves the leave-confirmation page titles the document, lets the user leave at once while the note is
 *          saved, asks while it is not and keeps the note on Stay, drops it on Discard, stops asking after Save, and
 *          asks the browser to hold the tab back only while there are unsaved changes.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded, and
 *           `beforeunload` is dispatched as a cancelable event.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-105
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { LeaveConfirmation } from "#src/routes/leave-confirmation/leave-confirmation";
import { LeaveConfirmationRoute } from "#src/routes/leave-confirmation/leave-confirmation.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <LeaveConfirmation />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const press = async (name: string) => {
  await act(async () => screen.getByRole("button", { name }).click());
};
const note = () => screen.getByRole("textbox", { name: "Note" }) as HTMLInputElement;
const type = (value: string) => fireEvent.change(note(), { target: { value } });
const isHeldBack = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

describe("LeaveConfirmation page", () => {
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

  it("titles the page and the document, and sits at /leave-confirmation under Overlays", () => {
    renderPage();
    expect(LeaveConfirmationRoute.path).toBe("/leave-confirmation");
    expect(LeaveConfirmationRoute.category).toBe("Overlays");
    expect(screen.getByRole("heading", { level: 1, name: "Leave confirmation" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Leave confirmation · Stackra Playground");
    expect(screen.getByRole("status").textContent).toBe("You are still on this page.");
  });

  it("lets the user leave at once while nothing is unsaved", async () => {
    renderPage();
    await press("Leave this page");
    await vi.waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("You left the page."),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("asks while the note is unsaved, keeps it on Stay and drops it on Discard", async () => {
    renderPage();
    type("Draft");
    await press("Leave this page");
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeTruthy();
    await press("Stay on page");
    await vi.waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("You stayed on the page."),
    );
    expect(note().value).toBe("Draft");

    await press("Leave this page");
    await press("Discard changes");
    await vi.waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("You left the page."),
    );
    expect(note().value).toBe("");
  });

  it("stops asking once the note is saved", async () => {
    renderPage();
    type("Draft");
    await press("Save");
    await press("Leave this page");
    await vi.waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("You left the page."),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(note().value).toBe("Draft");
  });

  it("asks the browser to hold the tab back only while there are unsaved changes", async () => {
    renderPage();
    expect(isHeldBack()).toBe(false);
    type("Draft");
    expect(isHeldBack()).toBe(true);
    expect(screen.getByText(/Unsaved changes: yes/)).toBeTruthy();
    await press("Save");
    expect(isHeldBack()).toBe(false);
    expect(screen.getByText(/Unsaved changes: none/)).toBeTruthy();
  });
});
