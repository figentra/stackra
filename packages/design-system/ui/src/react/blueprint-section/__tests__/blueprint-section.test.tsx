/**
 * Stackra file contract:
 * Purpose: proves the web BlueprintSection is a section ruled on its inline sides and top in the blueprint roles, a
 *          named region only with a label, carries its id for the dock and keeps clear of it, draws two hidden `+`
 *          marks on logical corners (so right-to-left mirrors them) or none, adds no focus stop of its own, and draws
 *          the same under reduced motion.
 * Boundary: jsdom with real HeroUI; classes and attributes are checked, not computed styles; `useReducedMotion` is
 *           stubbed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); ADR 0501 (section 9); STA-2041.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { BlueprintSection } from "#react/blueprint-section/blueprint-section";

const state = vi.hoisted(() => ({ isReduced: false }));
vi.mock("motion/react", async (load) => ({
  ...(await load<object>()),
  useReducedMotion: () => state.isReduced,
}));

describe("BlueprintSection (web)", () => {
  beforeEach(() => {
    state.isReduced = false;
  });

  it("is a ruled region named by its label, with its id, clear of the dock", () => {
    render(
      <BlueprintSection id="write" label="Write it once">
        <h2>Write it once</h2>
        <a href="/docs">Read the docs</a>
      </BlueprintSection>,
    );
    const section = screen.getByRole("region", { name: "Write it once" });
    expect(section.id).toBe("write");
    expect(section.className).toContain(
      "[border-inline:var(--blueprint-rule-width)_solid_var(--blueprint-rule)]",
    );
    expect(section.className).toContain(
      "[border-block-start:var(--blueprint-rule-width)_solid_var(--blueprint-rule)]",
    );
    expect(section.className).toContain("scroll-mb-(--blueprint-dock-height)");
    // The only focus stop is the caller's link.
    expect(section.querySelectorAll("a, button, [tabindex]")).toHaveLength(1);
  });

  it("draws two hidden marks at the top corners on logical sides, mirrored in right-to-left", () => {
    const { container } = render(
      <I18nProvider locale="ar">
        <BlueprintSection>
          <p>اكتبه مرة واحدة</p>
        </BlueprintSection>
      </I18nProvider>,
    );
    const marks = [...container.querySelectorAll('[data-slot="blueprint-mark"]')];
    expect(marks).toHaveLength(2);
    for (const mark of marks) {
      expect(mark.getAttribute("aria-hidden")).toBe("true");
      expect(mark.getAttribute("class")).toContain("size-(--blueprint-mark-size)");
      expect(mark.getAttribute("class")).toContain("text-accent");
    }
    expect(marks[0]?.getAttribute("class")).toContain("-start-[");
    expect(marks[1]?.getAttribute("class")).toContain("-end-[");
    expect(container.querySelector("[class*='left-'], [class*='right-']")).toBeNull();
    // Without a label it is a plain section, not a landmark.
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("draws no marks when asked, and the same under reduced motion", () => {
    const { container, rerender } = render(
      <BlueprintSection hasMarks={false}>
        <p>Body</p>
      </BlueprintSection>,
    );
    expect(container.querySelectorAll('[data-slot="blueprint-mark"]')).toHaveLength(0);
    const still = container.innerHTML;
    state.isReduced = true;
    rerender(
      <BlueprintSection hasMarks={false}>
        <p>Body</p>
      </BlueprintSection>,
    );
    expect(container.innerHTML).toBe(still);
  });
});
