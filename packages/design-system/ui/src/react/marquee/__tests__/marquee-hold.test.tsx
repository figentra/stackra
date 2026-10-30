/**
 * Stackra file contract:
 * Purpose: proves the web Marquee stops while held and goes on after: the pointer leaving plays it again, focus inside
 *          stops it and focus moving between its own links keeps it stopped until focus leaves; the pause button wins
 *          over a pointer leaving and Resume plays it; the loop keeps its speed when the content resizes; and the loop
 *          is cancelled when unmounted.
 * Boundary: jsdom has no Web Animations API or layout, so `animate`, the track's width and `ResizeObserver` are
 *           stand-ins; `useReducedMotion` is mocked to full motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.2.2; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Marquee } from "#react/marquee/marquee";

vi.mock("motion/react", () => ({ useReducedMotion: () => false }));

const updateTiming = vi.fn();
const player = { pause: vi.fn(), play: vi.fn(), cancel: vi.fn(), effect: { updateTiming } };
const animate = vi.fn(() => player);
let resized: (() => void) | undefined;

/** Calls back when the test says the track resized. */
class ResizeObserverStandIn {
  constructor(callback: () => void) {
    resized = callback;
  }

  observe() {}

  disconnect() {}
}

/** The marquee with two links, its viewport and its track 800px wide. */
function renderMarquee() {
  const view = render(
    <Marquee label="Brands" speed={40}>
      <a href="/dukkan">Dukkan</a>
      <a href="/jute">Jute</a>
    </Marquee>,
  );
  const track = view.container.querySelector<HTMLElement>('[data-slot="marquee-track"]');
  const viewport = track?.parentElement;
  if (!track || !viewport) throw new Error("no track");
  Object.defineProperty(track, "scrollWidth", { value: 800, configurable: true });
  return { ...view, track, viewport };
}

describe("Marquee hold (web)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("ResizeObserver", ResizeObserverStandIn);
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("plays again when the pointer leaves", () => {
    const { viewport } = renderMarquee();
    fireEvent.pointerEnter(viewport);
    expect(player.pause).toHaveBeenCalledTimes(1);
    fireEvent.pointerLeave(viewport);
    expect(player.play).toHaveBeenCalled();
  });

  it("stays stopped while focus moves between its links and plays when focus leaves", () => {
    renderMarquee();
    const [dukkan] = screen.getAllByRole("link", { name: "Dukkan" });
    const [jute] = screen.getAllByRole("link", { name: "Jute" });
    if (!dukkan || !jute) throw new Error("no links");
    act(() => dukkan.focus());
    expect(player.pause).toHaveBeenCalledTimes(1);
    player.play.mockClear();
    act(() => jute.focus());
    expect(player.play).not.toHaveBeenCalled();
    act(() => jute.blur());
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("keeps the pause button's stop when the pointer leaves, until Resume", () => {
    const { viewport } = renderMarquee();
    act(() => screen.getByRole("button", { name: "Pause scrolling" }).click());
    fireEvent.pointerEnter(viewport);
    player.play.mockClear();
    fireEvent.pointerLeave(viewport);
    expect(player.play).not.toHaveBeenCalled();
    act(() => screen.getByRole("button", { name: "Resume scrolling" }).click());
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("keeps its speed when the content resizes and cancels the loop when unmounted", () => {
    const { track, unmount } = renderMarquee();
    Object.defineProperty(track, "scrollWidth", { value: 1600, configurable: true });
    act(() => resized?.());
    // Half the track (one copy) at 40px a second.
    expect(updateTiming).toHaveBeenCalledWith({ duration: 20_000 });
    unmount();
    expect(player.cancel).toHaveBeenCalledTimes(1);
  });
});
