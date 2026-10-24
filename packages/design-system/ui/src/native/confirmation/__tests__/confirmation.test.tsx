/**
 * Stackra file contract:
 * Purpose: proves `useConfirmation()` on native: it throws outside a provider, resolves true when the user confirms
 *          and false when they refuse or the back button refuses, hands the question's words, tone and icon to the
 *          provider's one AlertDialog, locks the confirming button behind a typed text until it matches (trimmed, case
 *          counting) and starts every question with an empty field, refuses a question a new one replaces, resolves
 *          false when the provider unmounts, and keeps `confirm` the same function across renders.
 * Boundary: React Native does not render in vitest, so the native AlertDialog and TextField are replaced by stand-ins
 *           that render plain DOM and follow the real AlertDialog's contract (confirm calls `onConfirm` then
 *           `onOpenChange(false)`, cancel and the back button call `onOpenChange(false)`); the real dialog is proved
 *           in its own test.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0312; WCAG 2.2 SC 3.3.4; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-103
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ConfirmationOptions } from "#contracts/types/confirmation-options.type";
import { ConfirmationProvider } from "#native/confirmation/confirmation-provider";
import { useConfirmation } from "#native/confirmation/use-confirmation";

/** The props the dialog stand-in was last handed. */
const received = vi.hoisted(() => ({ dialog: {} as Record<string, unknown> }));

vi.mock("#native/alert-dialog/alert-dialog", async () => {
  const { createElement } = await import("react");
  return {
    AlertDialog: (props: Record<string, unknown>) => {
      received.dialog = props;
      if (!props["isOpen"]) return null;
      const close = props["onOpenChange"] as (next: boolean) => void;
      return createElement(
        "section",
        { role: "alertdialog" },
        createElement("h2", null, props["title"] as ReactNode),
        props["children"] as ReactNode,
        createElement("button", { onClick: () => close(false) }, props["cancelLabel"] as string),
        createElement(
          "button",
          {
            disabled: props["isConfirmDisabled"] === true,
            onClick: () => {
              (props["onConfirm"] as () => void)();
              close(false);
            },
          },
          props["confirmLabel"] as string,
        ),
      );
    },
  };
});
vi.mock("#native/text-field/text-field", async () => {
  const { createElement } = await import("react");
  return {
    TextField: (props: Record<string, unknown>) =>
      createElement("input", {
        "aria-label": props["label"] as string,
        value: props["value"] as string,
        onChange: (event: { target: { value: string } }) =>
          (props["onChange"] as (value: string) => void)(event.target.value),
      }),
  };
});

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
  options,
  onAnswer,
}: {
  readonly options: ConfirmationOptions;
  readonly onAnswer: (answer: boolean) => void;
}) {
  const confirm = useConfirmation();
  return (
    <button type="button" onClick={async () => onAnswer(await confirm(options))}>
      Ask
    </button>
  );
}

/** The typed question's field and confirming button, read fresh each time because the dialog redraws them. */
const typedField = () => screen.getByLabelText("Type Acme to confirm") as HTMLInputElement;
const confirmButton = () =>
  screen.getByRole("button", { name: "Delete Acme" }) as HTMLButtonElement;

const press = async (name: string) => {
  await act(async () => screen.getByRole("button", { name }).click());
};

describe("useConfirmation (native)", () => {
  it("throws outside a provider", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useConfirmation())).toThrow(
      "useConfirmation() needs a ConfirmationProvider above it",
    );
    quiet.mockRestore();
  });

  it("draws nothing until a question is asked, then hands over its words, tone and icon", async () => {
    render(
      <ConfirmationProvider>
        <Asker options={{ ...DELETE, tone: "danger", icon: "trash" }} onAnswer={vi.fn()} />
      </ConfirmationProvider>,
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await press("Ask");
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(received.dialog).toMatchObject({
      title: "Delete project?",
      description: "This cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      tone: "danger",
      icon: "trash",
    });
  });

  it("resolves true on confirm, and false on cancel or the back button", async () => {
    const onAnswer = vi.fn();
    render(
      <ConfirmationProvider>
        <Asker options={DELETE} onAnswer={onAnswer} />
      </ConfirmationProvider>,
    );
    await press("Ask");
    await press("Delete");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith(true));
    await press("Ask");
    await press("Keep");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(2));
    expect(onAnswer).toHaveBeenLastCalledWith(false);
    await press("Ask");
    // The back button reaches the provider as the dialog's own request to close.
    await act(async () => (received.dialog["onOpenChange"] as (next: boolean) => void)(false));
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(3));
    expect(onAnswer).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("locks the confirming button behind the typed text and starts each question empty", async () => {
    const onAnswer = vi.fn();
    render(
      <ConfirmationProvider>
        <Asker options={TYPED} onAnswer={onAnswer} />
      </ConfirmationProvider>,
    );
    await press("Ask");
    expect(confirmButton().disabled).toBe(true);
    fireEvent.change(typedField(), { target: { value: "acme" } });
    expect(confirmButton().disabled).toBe(true);
    fireEvent.change(typedField(), { target: { value: "  Acme " } });
    expect(confirmButton().disabled).toBe(false);

    await press("Keep Acme");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith(false));
    await press("Ask");
    expect(typedField().value).toBe("");
    expect(confirmButton().disabled).toBe(true);
    fireEvent.change(typedField(), { target: { value: "Acme" } });
    await press("Delete Acme");
    await vi.waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith(true));
  });

  it("draws no field for a plain question", async () => {
    render(
      <ConfirmationProvider>
        <Asker options={DELETE} onAnswer={vi.fn()} />
      </ConfirmationProvider>,
    );
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
    render(
      <ConfirmationProvider>
        <Both />
      </ConfirmationProvider>,
    );
    await press("Both");
    await vi.waitFor(() => expect(first).toHaveBeenCalledExactlyOnceWith(false));
    expect(screen.getByRole("heading", { name: "Another question?" })).toBeTruthy();
    expect(second).not.toHaveBeenCalled();
  });

  it("resolves false when the provider unmounts with a question open", async () => {
    const onAnswer = vi.fn();
    const { unmount } = render(
      <ConfirmationProvider>
        <Asker options={DELETE} onAnswer={onAnswer} />
      </ConfirmationProvider>,
    );
    await press("Ask");
    unmount();
    await vi.waitFor(() => expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false));
  });

  it("keeps confirm the same function on every render", () => {
    const { result, rerender } = renderHook(() => useConfirmation(), {
      wrapper: ConfirmationProvider,
    });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
