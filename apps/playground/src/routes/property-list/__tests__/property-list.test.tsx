/**
 * Stackra file contract:
 * Purpose: proves the property-list page titles the document, lists its samples as description lists, shows a dash and
 *          the given words for empty values and zero as a value, and that the live list switches to two columns, and
 *          copies a value to the clipboard and reports the text it copied.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and a stand-in clipboard; the theme CSS is
 *           not loaded, so classes and text are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); ADR 0022 (test
 *          placement).
 */
// @covers sta-350:FR-134
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { PropertyList } from "#src/routes/property-list/property-list";
import { PropertyListRoute } from "#src/routes/property-list/property-list.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <PropertyList />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const liveList = () => screen.getByRole("region", { name: "Try it" }).querySelector("dl");

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Property list page", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("titles the page and the document, and sits at /property-list under Data display", () => {
    renderPage();
    expect(PropertyListRoute.path).toBe("/property-list");
    expect(PropertyListRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: "Property list" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Property list · Stackra Playground");
  });

  it("shows one column and two columns as description lists", () => {
    renderPage();
    const lists = section("Columns").getAllByText("Customer");
    expect(lists).toHaveLength(2);
    const [single, double] = [...document.querySelectorAll("dl")];
    expect(single?.classList.contains("sm:grid-cols-2")).toBe(false);
    expect(double?.classList.contains("sm:grid-cols-2")).toBe(true);
  });

  it("shows a dash and the given words for empty values, and zero as a value", () => {
    renderPage();
    const values = section("Values");
    expect(values.getAllByText("–")).toHaveLength(1);
    expect(values.getAllByText("Not set")).toHaveLength(2);
    expect(values.getByText("0")).toBeTruthy();
  });

  it("switches the live list to two columns", () => {
    renderPage();
    const live = section("Try it");
    expect(liveList()?.classList.contains("sm:grid-cols-2")).toBe(false);
    fireEvent.click(live.getByRole("switch", { name: "Show two columns" }));
    expect(liveList()?.classList.contains("sm:grid-cols-2")).toBe(true);
  });

  it("copies a value, says Copied and reports the text", async () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByTestId("last-copied").textContent).toContain("nothing yet");
    fireEvent.click(live.getByRole("button", { name: "Copy total" }));
    await act(async () => undefined);
    expect(writeText).toHaveBeenCalledExactlyOnceWith("128.00");
    expect(live.getByTestId("last-copied").textContent).toContain("128.00");
    expect(live.getByRole("status").textContent).toBe("Copied");
  });
});
