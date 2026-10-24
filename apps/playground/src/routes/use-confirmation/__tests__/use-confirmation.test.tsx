/**
 * Stackra file contract:
 * Purpose: proves the use-confirmation page titles the document, shows its three questions, opens each in the
 *          provider's one dialog, answers in the status line on confirm and on decline, keeps the confirming button
 *          locked until the name is typed, and moves the counter only when the typed deletion is confirmed.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-105
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { UseConfirmation } from "#src/routes/use-confirmation/use-confirmation";
import { UseConfirmationRoute } from "#src/routes/use-confirmation/use-confirmation.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <UseConfirmation />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

/** The typed question's confirming button, read fresh each time because the dialog redraws it. */
const confirmButton = () => screen.getByRole("button", { name: "Delete Acme" });

const press = async (name: string) => {
  await act(async () => screen.getByRole("button", { name }).click());
};

describe("UseConfirmation page", () => {
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

  it("titles the page and the document, and sits at /use-confirmation under Overlays", () => {
    renderPage();
    expect(UseConfirmationRoute.path).toBe("/use-confirmation");
    expect(UseConfirmationRoute.category).toBe("Overlays");
    expect(screen.getByRole("heading", { level: 1, name: "useConfirmation" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("useConfirmation · Stackra Playground");
    expect(screen.getByRole("status").textContent).toBe("No answer yet.");
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("asks a plain question and answers in the status line", async () => {
    renderPage();
    await press("Archive project");
    expect(screen.getByRole("alertdialog", { name: "Archive this project?" })).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    await press("Archive");
    await vi.waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Archive project: confirmed."),
    );
    await press("Archive project");
    await press("Keep active");
    await vi.waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Archive project: declined."),
    );
  });

  it("asks the danger question with the danger mark", async () => {
    renderPage();
    await press("Delete project");
    const dialog = screen.getByRole("alertdialog", { name: "Delete this project?" });
    expect(dialog.querySelector('[data-slot="alert-dialog-icon"]')?.className).toContain(
      "alert-dialog__icon--danger",
    );
  });

  it("keeps the counter still until the typed deletion is confirmed", async () => {
    renderPage();
    expect(screen.getByText("Workspaces deleted: 0.")).toBeTruthy();
    await press("Delete workspace");
    expect((confirmButton() as HTMLButtonElement).disabled).toBe(true);
    await press("Keep Acme");
    await vi.waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Delete workspace: declined."),
    );
    expect(screen.getByText("Workspaces deleted: 0.")).toBeTruthy();

    await press("Delete workspace");
    fireEvent.change(screen.getByRole("textbox", { name: 'Type "Acme" to confirm' }), {
      target: { value: "Acme" },
    });
    expect((confirmButton() as HTMLButtonElement).disabled).toBe(false);
    await act(async () => confirmButton().click());
    await vi.waitFor(() => expect(screen.getByText("Workspaces deleted: 1.")).toBeTruthy());
  });
});
