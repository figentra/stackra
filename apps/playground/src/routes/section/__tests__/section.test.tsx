/**
 * Stackra file contract:
 * Purpose: proves the section page opens with the page's one `h1`, draws each part alone and the sample with every part,
 *          the actions (one, three, and six with three in the menu, a danger and a disabled one, a link action), two
 *          sections with one title told apart by label, the Arabic section in a right-to-left block, and the live
 *          section: Edit switches it between viewing and editing and the menu's choice is reported.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded. A role query
 *           finds nothing outside an open menu (React Aria hides the page behind it), so each case holds what it needs
 *           before it opens one.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0317; ADR 0022 (test placement).
 */
// @covers sta-350:FR-173
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Section } from "#src/routes/section/section";
import { SectionRoute } from "#src/routes/section/section.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <Section />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const group = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("Section page", () => {
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

  it("opens with the page's one h1, and sits at /section under Shell", () => {
    renderPage();
    expect(SectionRoute.path).toBe("/section");
    expect(SectionRoute.category).toBe("Shell");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Section" })).toBeTruthy();
    expect(document.title).toBe("Section · Stackra Playground");
  });

  it("draws every sample as a level-3 heading, skipping no level", () => {
    renderPage();
    expect(screen.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
    expect(document.querySelectorAll("#section-parts ~ ul h3")).toHaveLength(5);
    expect(document.querySelectorAll("#section-actions ~ ul h3")).toHaveLength(5);
  });

  it("names each sample by its title, and the two with one title by their labels", () => {
    renderPage();
    expect(screen.getByRole("region", { name: "Order details" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Billing address" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Shipping address" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Address" })).toBeNull();
  });

  it("draws the sample with every part: description, start slot, actions, status and body", () => {
    renderPage();
    const every = group("Order details");
    expect(every.getByText("What the order holds")).toBeTruthy();
    expect(every.getByText("AL")).toBeTruthy();
    expect(every.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Add",
      "Edit",
    ]);
    expect(every.getByText("Paid in full on 3 March")).toBeTruthy();
    expect(every.getByText("ada@example.com")).toBeTruthy();
  });

  it("draws six actions as three buttons and a menu of three", () => {
    renderPage();
    const six = group("Items");
    expect(six.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Add",
      "Edit",
      "Export",
      "",
    ]);
    press(six.getByRole("button", { name: "More actions for this section" }));
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Duplicate",
      "Print",
      "Archive",
    ]);
  });

  it("draws a disabled action as a disabled button and a link action as a link", () => {
    renderPage();
    expect(
      group("Danger zone").getByRole<HTMLButtonElement>("button", { name: "Archive" }).disabled,
    ).toBe(true);
    expect(
      group("Related").getByRole("link", { name: "Open the page header" }).getAttribute("href"),
    ).toBe("/page-header");
  });

  it("draws the Arabic section in a right-to-left block with Arabic text", () => {
    renderPage();
    const block = document.querySelector("[data-sample='arabic']") as HTMLElement;
    expect(block.getAttribute("dir")).toBe("rtl");
    expect(within(block).getByRole("heading", { level: 3, name: "تفاصيل الطلب" })).toBeTruthy();
    expect(within(block).getByRole("button", { name: "تعديل" })).toBeTruthy();
  });

  it("switches the live section between viewing and editing, and reports the menu's choice", () => {
    renderPage();
    const live = group("Contact details");
    const status = document.querySelector("[data-sample='live-status']") as HTMLElement;
    expect(live.getByText("Viewing the contact details.")).toBeTruthy();
    expect(status.textContent).toBe("No action chosen.");

    press(live.getByRole("button", { name: "Edit" }));
    expect(live.getByText("Editing the contact details.")).toBeTruthy();
    expect(live.getByRole("button", { name: "Done" })).toBeTruthy();

    press(live.getByRole("button", { name: "Export" }));
    expect(status.textContent).toBe("Action chosen: Export.");

    press(live.getByRole("button", { name: "More actions for this section" }));
    press(screen.getByRole("menuitem", { name: "Archive" }));
    expect(status.textContent).toBe("Action chosen: Archive.");
  });
});
