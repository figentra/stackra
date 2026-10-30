/**
 * Stackra file contract:
 * Purpose: proves the web Marquee is a named group with a second, hidden and inert copy, loops leftward (rightward in
 *          Arabic), stops on hover and with its pause button, and under reduced motion shows one still copy with no
 *          button.
 * Boundary: jsdom with real HeroUI; `Element.animate` is a recording stand-in; reduced motion is stubbed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 2.2.2; STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { Marquee } from "#react/marquee/marquee";

const state = vi.hoisted(() => ({ isReduced: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => state.isReduced }));

const player = { pause: vi.fn(), play: vi.fn(), cancel: vi.fn(), effect: null };
const animate = vi.fn((_keyframes: Keyframe[], _options: KeyframeAnimationOptions) => player);

describe("Marquee (web)", () => {
  beforeEach(() => {
    state.isReduced = false;
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
  });

  it("loops two copies, the second hidden, and pauses", () => {
    render(
      <Marquee label="Brands we carry">
        <span>Dukkan</span>
        <span>Jute</span>
      </Marquee>,
    );
    const group = screen.getByRole("group", { name: "Brands we carry" });
    expect(screen.getAllByText("Dukkan")).toHaveLength(2);
    const copy = screen.getAllByText("Dukkan")[1]?.parentElement;
    expect(copy?.getAttribute("aria-hidden")).toBe("true");
    expect(copy?.hasAttribute("inert")).toBe(true);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0]?.[0]).toEqual([
      { transform: "translateX(0)" },
      { transform: "translateX(-50%)" },
    ]);
    fireEvent.pointerEnter(copy?.parentElement?.parentElement as HTMLElement);
    expect(player.pause).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Pause scrolling" }));
    expect(screen.getByRole("button", { name: "Resume scrolling" })).toBeTruthy();
    expect(group).toBeTruthy();
  });

  it("moves rightward in Arabic", () => {
    render(
      <I18nProvider locale="ar">
        <Marquee label="العلامات">
          <span>دكان</span>
        </Marquee>
      </I18nProvider>,
    );
    expect(animate.mock.calls[0]?.[0]).toEqual([
      { transform: "translateX(0)" },
      { transform: "translateX(50%)" },
    ]);
  });

  it("stands still and wraps under reduced motion", () => {
    state.isReduced = true;
    render(
      <Marquee label="Brands we carry">
        <span>Dukkan</span>
      </Marquee>,
    );
    expect(screen.getAllByText("Dukkan")).toHaveLength(1);
    expect(screen.queryByRole("button")).toBeNull();
    expect(animate).not.toHaveBeenCalled();
  });
});
