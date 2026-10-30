/**
 * Stackra file contract:
 * Purpose: proves the web TocRail: a navigation landmark of in-page links, the current one marked
 *          `aria-current="location"`, followed by an IntersectionObserver when uncontrolled; a click scrolls to the
 *          heading, moves focus there, updates the hash and reports the id; the floating variant opens from a button.
 * Boundary: jsdom; `IntersectionObserver` is replaced by a stand-in the test fires by hand, and `scrollIntoView`
 *           is stubbed because jsdom has none.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { TocRail } from "#react/toc-rail/toc-rail";

const ITEMS = [
  { id: "intro", label: "Intro" },
  { id: "setup", label: "Setup", level: 3 as const },
];

const press = (element: HTMLElement) => act(() => element.click());

let fire: (entries: { target: { id: string }; isIntersecting: boolean }[]) => void = () => {};
const disconnect = vi.fn();

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof fire) {
        fire = callback;
      }

      observe() {}

      disconnect() {
        disconnect();
      }
    },
  );
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const heading of document.querySelectorAll("body > h2")) heading.remove();
});

describe("TocRail (web)", () => {
  it("lists the headings as links and follows the one in view", () => {
    for (const id of ["intro", "setup"]) {
      const heading = document.createElement("h2");
      heading.id = id;
      document.body.append(heading);
    }
    const { unmount } = render(<TocRail items={ITEMS} />);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(nav).toBeTruthy();
    expect(screen.getByRole("link", { name: "Intro" }).getAttribute("aria-current")).toBe(
      "location",
    );
    expect(screen.getByRole("link", { name: "Setup" }).className).toContain("ps-6");
    act(() =>
      fire([
        { target: { id: "intro" }, isIntersecting: false },
        { target: { id: "setup" }, isIntersecting: true },
      ]),
    );
    expect(screen.getByRole("link", { name: "Setup" }).getAttribute("aria-current")).toBe(
      "location",
    );
    expect(screen.getByRole("link", { name: "Intro" }).hasAttribute("aria-current")).toBe(false);
    act(() => fire([{ target: { id: "setup" }, isIntersecting: false }]));
    expect(screen.getByRole("link", { name: "Setup" }).getAttribute("aria-current")).toBe(
      "location",
    );
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("scrolls to the heading, focuses it, sets the hash and reports the id", () => {
    const heading = document.createElement("h2");
    heading.id = "setup";
    document.body.append(heading);
    const onSelect = vi.fn();
    render(<TocRail items={ITEMS} activeId="intro" onSelect={onSelect} label="Contents" />);
    press(screen.getByRole("link", { name: "Setup" }));
    expect(heading.scrollIntoView).toHaveBeenCalled();
    expect(heading.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(heading);
    expect(location.hash).toBe("#setup");
    expect(onSelect).toHaveBeenCalledWith("setup");
    // The controlled current item does not move by itself.
    expect(screen.getByRole("link", { name: "Intro" }).getAttribute("aria-current")).toBe(
      "location",
    );
  });

  it("still reports a link whose heading is missing", () => {
    const onSelect = vi.fn();
    render(<TocRail items={ITEMS} onSelect={onSelect} />);
    press(screen.getByRole("link", { name: "Intro" }));
    expect(onSelect).toHaveBeenCalledWith("intro");
  });

  it("opens the floating variant from its button", () => {
    render(<TocRail items={ITEMS} variant="floating" />);
    expect(screen.queryByRole("navigation")).toBeNull();
    press(screen.getByRole("button", { name: "Open the page contents" }));
    expect(screen.getByRole("navigation", { name: "On this page" })).toBeTruthy();
  });
});
