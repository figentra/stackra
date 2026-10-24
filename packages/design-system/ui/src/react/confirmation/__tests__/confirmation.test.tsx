/**
 * Stackra file contract:
 * Purpose: proves `useConfirmation()` on web: it throws outside a provider, resolves true when the user confirms and
 *          false when they refuse or press Escape, draws the question's words, tone and icon in the provider's one
 *          dialog, locks the confirming button behind a typed text until it matches (trimmed, case counting) and
 *          starts every question with an empty field, refuses a question a new one replaces, resolves false when the
 *          provider unmounts, and keeps `confirm` the same function across renders.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so exit animations end at once.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 3.3.4; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-103
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

import type { ConfirmationOptions } from "#contracts/types/confirmation-options.type";
import { ConfirmationProvider } from "#react/confirmation/confirmation-provider";
import { useConfirmation } from "#react/confirmation/use-confirmation";

const registry = defineIconRegistry({ info: Info, "circle-alert": CircleAlert });

const DELETE: ConfirmationOptions = {
  title: "Delete project?",
  description: "This cannot be undone.",
  confirmLabel: "Delete",
  cancelLabel: "Keep",
};

const TYPED: ConfirmationOptions = {
  title: "Delete Acme?",
  confirmLabel: "Delete Acme",
  cancelLabel: "Keep Acme",
  tone: "danger",
  confirmationText: "Acme",
  confirmationLabel: "Type Acme to confirm",
};

/** A button that asks `options` and reports the answer, as an app's handler would. */
function Asker({
  label,
  options,
  onAnswer,
}: {
  readonly label: string;
  readonly options: ConfirmationOptions;
  readonly onAnswer: (answer: boolean) => void;
}) {
  const confirm = useConfirmation();
  return (
    <button type="button" onClick={async () => onAnswer(await confirm(options))}>
      {label}
    </button>
  );
}

/** The provider an app would mount, with the icons registered. */
const wrap = (children: ReactNode) => (
  <IconRegistryProvider registry={registry}>
    <ConfirmationProvider>{children}</ConfirmationProvider>
  </IconRegistryProvider>
);

/** The typed question's confirming button, read fresh each time because the dialog redraws it. */
const confirmButton = () =>
  screen.getByRole("button", { name: "Delete Acme" }) as HTMLButtonElement;

const press = async (name: string) => {
  await act(async () => screen.getByRole("button", { name }).click());
};

describe("useConfirmation (web)", () => {
  it("throws outside a provider", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useConfirmation())).toThrow(
      "useConfirmation() needs a ConfirmationProvider above it",
    );
    quiet.mockRestore();
  });

  it("draws nothing until a question is asked, then the question's words", async () => {
    const onAnswer = vi.fn();
    render(wrap(<Asker label="Ask" options={DELETE} onAnswer={onAnswer} />));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await press("Ask");
    expect(screen.getByRole("alertdialog", { name: "Delete project?" })).toBeTruthy();
    expect(screen.getByText("This cannot be undone.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Keep" })).toBeTruthy();
  });

  it("resolves true on confirm", async () => {
    const onAnswer = vi.fn();
    render(wrap(<Asker label="Ask" options={DELETE} onAnswer={onAnswer} />));
    await press("Ask");
    await press("Delete");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true));
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("resolves false on cancel and on Escape", async () => {
    const onAnswer = vi.fn();
    render(wrap(<Asker label="Ask" options={DELETE} onAnswer={onAnswer} />));
    await press("Ask");
    await press("Keep");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith(false));
    await press("Ask");
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    });
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(2));
    expect(onAnswer).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("draws the tone and the icon of the question", async () => {
    const onAnswer = vi.fn();
    render(
      wrap(
        <Asker
          label="Ask"
          options={{ ...DELETE, tone: "danger", icon: "info" }}
          onAnswer={onAnswer}
        />,
      ),
    );
    await press("Ask");
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.querySelector('[data-slot="alert-dialog-icon"]')?.className).toContain(
      "alert-dialog__icon--danger",
    );
    expect(dialog.querySelector("svg.lucide-info")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete" }).className).toContain("button--danger");
  });

  it("locks the confirming button behind the typed text and starts each question empty", async () => {
    const onAnswer = vi.fn();
    render(wrap(<Asker label="Ask" options={TYPED} onAnswer={onAnswer} />));
    await press("Ask");
    const field = screen.getByRole("textbox", { name: "Type Acme to confirm" }) as HTMLInputElement;
    expect(confirmButton().disabled).toBe(true);

    fireEvent.change(field, { target: { value: "acme" } });
    expect(confirmButton().disabled).toBe(true);
    fireEvent.change(field, { target: { value: "Acm" } });
    expect(confirmButton().disabled).toBe(true);
    fireEvent.change(field, { target: { value: "  Acme " } });
    expect(confirmButton().disabled).toBe(false);

    await press("Keep Acme");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith(false));
    await press("Ask");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
    expect(confirmButton().disabled).toBe(true);
  });

  it("confirms a typed question once the text matches", async () => {
    const onAnswer = vi.fn();
    render(wrap(<Asker label="Ask" options={TYPED} onAnswer={onAnswer} />));
    await press("Ask");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Acme" } });
    await press("Delete Acme");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true));
  });

  it("draws no field for a plain question", async () => {
    render(wrap(<Asker label="Ask" options={DELETE} onAnswer={vi.fn()} />));
    await press("Ask");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect((screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it("refuses a question that a new one replaces", async () => {
    const first = vi.fn();
    const second = vi.fn();
    function Both() {
      const confirm = useConfirmation();
      return (
        <button
          type="button"
          onClick={() => {
            void confirm(DELETE).then(first);
            void confirm({ ...DELETE, title: "Another question?" }).then(second);
          }}
        >
          Both
        </button>
      );
    }
    render(wrap(<Both />));
    await press("Both");
    await vi.waitFor(() => expect(first).toHaveBeenCalledExactlyOnceWith(false));
    expect(screen.getByRole("alertdialog", { name: "Another question?" })).toBeTruthy();
    expect(second).not.toHaveBeenCalled();
    await press("Delete");
    await vi.waitFor(() => expect(second).toHaveBeenCalledExactlyOnceWith(true));
  });

  it("resolves false when the provider unmounts with a question open", async () => {
    const onAnswer = vi.fn();
    const { unmount } = render(wrap(<Asker label="Ask" options={DELETE} onAnswer={onAnswer} />));
    await press("Ask");
    unmount();
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false));
  });

  it("keeps confirm the same function on every render", () => {
    const { result, rerender } = renderHook(() => useConfirmation(), {
      wrapper: ({ children }: { children: ReactNode }) => wrap(children),
    });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
