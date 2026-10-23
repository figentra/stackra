/**
 * Stackra file contract:
 * Purpose: proves the text-field page titles the document, shows both variants, the parts, the states, one field per
 *          kind of text and both widths, and that the live email field shows its error once there is text without an
 *          at sign, clears it when there is one, and echoes what is typed.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-063 sta-350:FR-064 sta-350:P-030
import { TextFieldType } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { TextField } from "#src/routes/text-field/text-field";
import { TextFieldRoute } from "#src/routes/text-field/text-field.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <TextField />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Text field page", () => {
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

  it("titles the page and the document, and sits at /text-field under Inputs", () => {
    renderPage();
    expect(TextFieldRoute.path).toBe("/text-field");
    expect(TextFieldRoute.category).toBe("Inputs");
    expect(screen.getByRole("heading", { level: 1, name: "Text field" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Text field · Stackra Playground");
  });

  it("shows both variants, the three parts and the four states", () => {
    renderPage();
    const variants = section("Variants");
    expect(variants.getByLabelText("Primary field")).toBeTruthy();
    expect(variants.getByLabelText("Secondary field")).toBeTruthy();
    const parts = section("Parts");
    expect(parts.getByPlaceholderText("Ada Lovelace")).toBeTruthy();
    expect(parts.getByText("As it appears on your invoices.")).toBeTruthy();
    const states = section("States");
    expect(states.getByText("Enter a name of at least two letters.")).toBeTruthy();
    expect(states.getByLabelText("Disabled field").hasAttribute("disabled")).toBe(true);
    expect(states.getByLabelText("Read-only field").hasAttribute("readonly")).toBe(true);
    expect(states.getByLabelText(/Required field/).hasAttribute("required")).toBe(true);
  });

  it("shows one field per kind of text, with the matching input type", () => {
    renderPage();
    const kinds = section("Kinds of text");
    for (const kind of TextFieldType)
      expect(kinds.getByLabelText(`Kind: ${kind}`).getAttribute("type"), kind).toBe(kind);
  });

  it("shows a full-width field and a content-width one", () => {
    renderPage();
    const width = section("Width");
    const roots = ["Full width", "Content width"].map((name) =>
      width.getByLabelText(name).closest('[data-slot="textfield"]'),
    );
    expect(roots[0]?.classList.contains("textfield--full-width")).toBe(true);
    expect(roots[1]?.classList.contains("textfield--full-width")).toBe(false);
  });

  it("shows the live field's error from the first character without an at sign, and echoes the text", () => {
    renderPage();
    const live = section("Try it");
    const input = live.getByLabelText("Work email");
    expect(live.queryByText("Enter an email address with an at sign.")).toBeNull();
    expect(live.getByText("Nothing typed yet.")).toBeTruthy();
    fireEvent.change(input, { target: { value: "ada" } });
    expect(live.getByText("Enter an email address with an at sign.")).toBeTruthy();
    expect(live.getByText("You typed 3 characters: ada")).toBeTruthy();
    fireEvent.change(input, { target: { value: "ada@example.com" } });
    expect(live.queryByText("Enter an email address with an at sign.")).toBeNull();
    expect(live.getByText("You typed 15 characters: ada@example.com")).toBeTruthy();
  });
});
