/**
 * Stackra file contract:
 * Purpose: proves the form-section page titles the document, shows a title-only section, a described one and one of
 *          several fields, a disabled section whose field is disabled, and that the live form's switch disables its
 *          second section and everything in it, and enables it again.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @covers sta-350:FR-060 sta-350:FR-062
import { DesignSystemProvider } from "@stackra/ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { FormSection } from "#src/routes/form-section/form-section";
import { FormSectionRoute } from "#src/routes/form-section/form-section.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <FormSection />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Form section page", () => {
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

  it("titles the page and the document, and sits at /form-section under Forms", () => {
    renderPage();
    expect(routePath(FormSectionRoute)).toBe("/form-section");
    expect(FormSectionRoute.category).toBe("Inputs and forms");
    expect(screen.getByRole("heading", { level: 1, name: "Form section" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Form section · Stackra Playground");
  });

  it("shows a title-only section, a described one and one of several fields", () => {
    renderPage();
    const parts = section("Parts");
    expect(parts.getByRole("group", { name: "Title only" })).toBeTruthy();
    const described = parts.getByRole("group", { name: "With a description" });
    expect(described.getAttribute("aria-describedby")).toBe(
      parts.getByText("Where we send invoices and how we address you.").id,
    );
    expect(
      within(parts.getByRole("group", { name: "Several fields" })).getAllByRole("textbox"),
    ).toHaveLength(2);
  });

  it("disables the field of a disabled section", () => {
    renderPage();
    const group = section("States").getByRole("group", { name: "Disabled section" });
    expect(group.hasAttribute("disabled")).toBe(true);
    expect(within(group).getByRole("textbox", { name: "Company" }).matches(":disabled")).toBe(true);
  });

  it("disables the billing section and its fields with the switch, and enables them again", () => {
    renderPage();
    const live = section("Try it");
    const address = () => live.getByRole("textbox", { name: "Billing address" });
    expect(address().matches(":disabled")).toBe(false);
    fireEvent.click(live.getByRole("switch", { name: "Disable the billing section" }));
    // HeroUI wraps a disabled fieldset's children in context providers, so the fields are drawn afresh: query again.
    expect(live.getByRole("group", { name: "Billing" }).hasAttribute("disabled")).toBe(true);
    expect(address().matches(":disabled")).toBe(true);
    fireEvent.click(live.getByRole("switch", { name: "Disable the billing section" }));
    expect(address().matches(":disabled")).toBe(false);
  });
});
