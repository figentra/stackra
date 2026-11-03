/**
 * Stackra file contract:
 * Purpose: proves the web SectionDock is a navigation landmark of `#id` links that take focus in order, marks the
 *          first section current at first and then follows the one in view (`aria-current="location"`, the accent
 *          fill), keeps only the current link under `md`, says the current section's status in a `status` line that
 *          changes only when the current section does, sits on the blueprint rule and toolbar material on logical
 *          sides in right-to-left, and behaves the same under reduced motion.
 * Boundary: jsdom; `IntersectionObserver` is replaced by a stand-in the test fires by hand; the `max-md:` hiding is a
 *           class, so the media query itself is not run; `useReducedMotion` is stubbed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); ADR 0501 (section 9); STA-2041.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { SectionDock } from "#react/section-dock/section-dock";

const state = vi.hoisted(() => ({ isReduced: false }));
vi.mock("motion/react", async (load) => ({
  ...(await load<object>()),
  useReducedMotion: () => state.isReduced,
}));

const ITEMS = [
  { id: "write", label: "Write", status: "writing the action" },
  { id: "expose", label: "Expose", status: "gen: 1 endpoint" },
  { id: "call", label: "Call" },
];

let fire: (entries: { target: { id: string }; isIntersecting: boolean }[]) => void = () => {};
const observed: string[] = [];
const disconnect = vi.fn();

const link = (name: string) => screen.getByRole("link", { name });

describe("SectionDock (web)", () => {
  beforeEach(() => {
    state.isReduced = false;
    observed.length = 0;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof fire) {
          fire = callback;
        }

        observe(element: Element) {
          observed.push(element.id);
        }

        disconnect() {
          disconnect();
        }
      },
    );
    for (const { id } of ITEMS) {
      const section = document.createElement("section");
      section.id = id;
      document.body.append(section);
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const section of document.querySelectorAll("body > section")) section.remove();
  });

  it("is a navigation of section links that take focus in order, the first one current", () => {
    const { unmount } = render(<SectionDock label="Sections" items={ITEMS} />);
    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav.className).toContain("material-role-toolbar");
    expect(nav.className).toContain("h-(--blueprint-dock-height)");
    expect(nav.className).toContain(
      "[border-block-start:var(--blueprint-rule-width)_solid_var(--blueprint-rule)]",
    );
    const links = screen.getAllByRole("link");
    expect(links.map((item) => item.getAttribute("href"))).toEqual(["#write", "#expose", "#call"]);
    for (const item of links) {
      item.focus();
      expect(document.activeElement).toBe(item);
    }
    expect(link("Write").getAttribute("aria-current")).toBe("location");
    expect(link("Write").className).toContain("bg-accent");
    expect(screen.getByRole("status").textContent).toBe("writing the action");
    expect(observed).toEqual(["write", "expose", "call"]);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("follows the section in view, shows only the current link under md, and says its status", () => {
    render(<SectionDock label="Sections" items={ITEMS} />);
    act(() =>
      fire([
        { target: { id: "write" }, isIntersecting: false },
        { target: { id: "expose" }, isIntersecting: true },
      ]),
    );
    expect(link("Expose").getAttribute("aria-current")).toBe("location");
    expect(link("Write").hasAttribute("aria-current")).toBe(false);
    expect(link("Write").closest("li")?.className).toContain("max-md:hidden");
    expect(link("Expose").closest("li")?.className ?? "").not.toContain("max-md:hidden");
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("gen: 1 endpoint");
    // Leaving every section keeps the current one, so the status does not flicker.
    act(() => fire([{ target: { id: "expose" }, isIntersecting: false }]));
    expect(status.textContent).toBe("gen: 1 endpoint");
    act(() => fire([{ target: { id: "call" }, isIntersecting: true }]));
    expect(status.textContent).toBe("");
  });

  it("sits on logical sides in right-to-left and behaves the same under reduced motion", () => {
    state.isReduced = true;
    render(
      <I18nProvider locale="ar">
        <SectionDock
          label="الأقسام"
          items={[
            { id: "write", label: "اكتب", status: "نكتب الإجراء" },
            { id: "expose", label: "اكشف" },
          ]}
        />
      </I18nProvider>,
    );
    expect(screen.getByRole("navigation", { name: "الأقسام" })).toBeTruthy();
    expect(screen.getByRole("status").className).toContain("ms-auto");
    expect(screen.getByRole("status").textContent).toBe("نكتب الإجراء");
    act(() => fire([{ target: { id: "expose" }, isIntersecting: true }]));
    expect(link("اكشف").getAttribute("aria-current")).toBe("location");
  });
});
