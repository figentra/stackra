/**
 * Stackra file contract:
 * Purpose: proves the text-area page titles the document, shows both variants, the parts, the two line counts, the
 *          states and both widths, and that the live message area counts its characters and shows its error only past
 *          the limit.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-066 sta-350:FR-067 sta-350:P-030
import { DesignSystemProvider } from "@stackra/ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { TextArea } from "#src/routes/text-area/text-area";
import { TextAreaRoute } from "#src/routes/text-area/text-area.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <TextArea />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Text area page", () => {
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

  it("titles the page and the document, and sits at /text-area under Inputs", () => {
    renderPage();
    expect(routePath(TextAreaRoute)).toBe("/text-area");
    expect(TextAreaRoute.category).toBe("Inputs and forms");
    expect(screen.getByRole("heading", { level: 1, name: "Text area" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Text area · Stackra Playground");
  });

  it("shows both variants, the parts, the lines and the four states", () => {
    renderPage();
    const variants = section("Variants");
    expect(variants.getByLabelText("Primary area")).toBeTruthy();
    expect(variants.getByLabelText("Secondary area")).toBeTruthy();
    const parts = section("Parts");
    expect(parts.getByPlaceholderText("Tell us what happened")).toBeTruthy();
    expect(parts.getByText("Include the order number if you have one.")).toBeTruthy();
    const lines = section("Lines");
    expect((lines.getByLabelText("Two lines") as HTMLTextAreaElement).rows).toBe(2);
    expect((lines.getByLabelText("Six lines") as HTMLTextAreaElement).rows).toBe(6);
    const states = section("States");
    expect(states.getByText("Write at least ten characters.")).toBeTruthy();
    expect(states.getByLabelText("Disabled area").hasAttribute("disabled")).toBe(true);
    expect(states.getByLabelText("Read-only area").hasAttribute("readonly")).toBe(true);
    expect(states.getByLabelText(/Required area/).hasAttribute("required")).toBe(true);
  });

  it("shows a full-width area and a content-width one", () => {
    renderPage();
    const width = section("Width");
    const roots = ["Full width area", "Content width area"].map((name) =>
      width.getByLabelText(name).closest('[data-slot="textfield"]'),
    );
    expect(roots[0]?.classList.contains("textfield--full-width")).toBe(true);
    expect(roots[1]?.classList.contains("textfield--full-width")).toBe(false);
  });

  it("counts the live message and shows its error only past the limit", () => {
    renderPage();
    const live = section("Try it");
    const area = live.getByLabelText("Message");
    expect(live.getByText("0 of 40 characters")).toBeTruthy();
    fireEvent.change(area, { target: { value: "x".repeat(40) } });
    expect(live.getByText("40 of 40 characters")).toBeTruthy();
    expect(live.queryByText("The message is over 40 characters.")).toBeNull();
    fireEvent.change(area, { target: { value: "x".repeat(41) } });
    expect(live.getByText("41 of 40 characters")).toBeTruthy();
    expect(live.getByText("The message is over 40 characters.")).toBeTruthy();
  });
});
