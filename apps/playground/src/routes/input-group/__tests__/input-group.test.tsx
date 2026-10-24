/**
 * Stackra file contract:
 * Purpose: proves the input-group page titles the document, shows both variants, the text and element affixes, the
 *          states and both widths, that the password button reveals and hides the value, and that the live slug
 *          preview follows what is typed.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-069 sta-350:FR-070 sta-350:P-030
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { InputGroup } from "#src/routes/input-group/input-group";
import { InputGroupRoute } from "#src/routes/input-group/input-group.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <InputGroup />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Input group page", () => {
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

  it("titles the page and the document, and sits at /input-group under Inputs", () => {
    renderPage();
    expect(InputGroupRoute.path).toBe("/input-group");
    expect(InputGroupRoute.category).toBe("Inputs and forms");
    expect(screen.getByRole("heading", { level: 1, name: "Input group" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Input group · Stackra Playground");
  });

  it("shows both variants, the affixes and the four states", () => {
    renderPage();
    const variants = section("Variants");
    expect(variants.getByLabelText("Primary group")).toBeTruthy();
    expect(variants.getByLabelText("Secondary group")).toBeTruthy();
    const affixes = section("Prefix and suffix");
    const groups = [
      ...document.querySelectorAll('#input-group-affixes ~ div [data-slot="input-group"]'),
    ];
    expect(groups.map((group) => group.textContent)).toEqual(["https://", "kg", "$USD", "$.00"]);
    expect(affixes.getByLabelText("Prefix only")).toBeTruthy();
    const states = section("States");
    expect(states.getByText("Enter a weight in kilograms.")).toBeTruthy();
    expect(states.getByLabelText("Disabled group").hasAttribute("disabled")).toBe(true);
    expect(states.getByLabelText("Read-only group").hasAttribute("readonly")).toBe(true);
    expect(states.getByLabelText(/Required group/).hasAttribute("required")).toBe(true);
  });

  it("shows a full-width group and a content-width one", () => {
    renderPage();
    const width = section("Width");
    const groups = ["Full width group", "Content width group"].map((name) =>
      width.getByLabelText(name).closest('[data-slot="input-group"]'),
    );
    expect(groups[0]?.classList.contains("input-group--full-width")).toBe(true);
    expect(groups[1]?.classList.contains("input-group--full-width")).toBe(false);
  });

  it("reveals and hides the password with the button in the suffix", () => {
    renderPage();
    const elements = section("Element affixes");
    const input = elements.getByLabelText("Password");
    expect(input.getAttribute("type")).toBe("password");
    act(() => elements.getByRole("button", { name: "Show password" }).click());
    expect(input.getAttribute("type")).toBe("text");
    act(() => elements.getByRole("button", { name: "Hide password" }).click());
    expect(input.getAttribute("type")).toBe("password");
  });

  it("follows the typed slug in the live preview", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("https://figentra.com/summer-sale")).toBeTruthy();
    fireEvent.change(live.getByLabelText("Page address"), { target: { value: "spring" } });
    expect(live.getByText("https://figentra.com/spring")).toBeTruthy();
  });
});
