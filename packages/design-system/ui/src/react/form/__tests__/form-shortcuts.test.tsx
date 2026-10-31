/**
 * Stackra file contract:
 * Purpose: proves the web Form submits on Mod+Enter through the shortcut registry while focus is inside it, and `submitShortcut={false}` turns it off.
 * Boundary: jsdom with real HeroUI and React Aria inside a ShortcutProvider; keys dispatched with their `code`.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0508.
 */
// @vitest-environment jsdom
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { fireEvent, render, screen } from "@testing-library/react";

import { Form } from "#react/form/form";

const modEnter = (target: HTMLElement) =>
  fireEvent.keyDown(target, { key: "Enter", code: "Enter", ctrlKey: true });

describe("Form shortcuts (web)", () => {
  it("submits on Mod+Enter from a text field, and not when turned off", () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const { rerender } = render(
      <ShortcutProvider>
        <Form isSubmitOnModEnter onSubmit={onSubmit}>
          <input aria-label="Note" />
        </Form>
      </ShortcutProvider>,
    );
    modEnter(screen.getByLabelText("Note"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    rerender(
      <ShortcutProvider>
        <Form isSubmitOnModEnter submitShortcut={false} onSubmit={onSubmit}>
          <input aria-label="Note" />
        </Form>
      </ShortcutProvider>,
    );
    modEnter(screen.getByLabelText("Note"));
    // The form's own Mod+Enter handling still submits once; the registry adds nothing.
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
