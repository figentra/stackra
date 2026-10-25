/**
 * Stackra file contract:
 * Purpose: proves the web Reveal hands Motion the theme's reveal step (400ms, its cubic-bezier) with an 8px rise, waits
 *          one stagger step (40ms) per `index`, shows the content at once under reduced motion or with `isAnimated`
 *          off, renders its children and passes other props through.
 * Boundary: Motion is replaced by a recording stand-in, so what reaches Motion is checked, not the animation a browser
 *          plays.
 * Runtime: browser
 * Governing contract: ADR 0329 (motion layer); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-430:FR-002 sta-430:FR-004 sta-430:P-001 sta-430:P-003
import { render, screen } from "@testing-library/react";

import { Reveal } from "#react/reveal/reveal";

const state = vi.hoisted(() => ({ props: {} as Record<string, unknown>, isReduced: false }));

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  return {
    motion: {
      div: ({ initial, animate, transition, children, ...rest }: Record<string, unknown>) => {
        state.props = { initial, animate, transition };
        return createElement("div", rest, children as never);
      },
    },
    useReducedMotion: () => state.isReduced,
  };
});

describe("Reveal (web)", () => {
  beforeEach(() => {
    state.props = {};
    state.isReduced = false;
  });

  it("fades its content in and raises it 8px with the theme's reveal step", () => {
    render(<Reveal id="r">Hello</Reveal>);
    expect(screen.getByText("Hello").id).toBe("r");
    expect(state.props["initial"]).toEqual({ opacity: 0, y: 8 });
    expect(state.props["animate"]).toEqual({ opacity: 1, y: 0 });
    expect(state.props["transition"]).toEqual({
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
      delay: 0,
    });
  });

  it("waits one stagger step per place in the row", () => {
    render(<Reveal index={3}>Third</Reveal>);
    expect((state.props["transition"] as { delay: number }).delay).toBeCloseTo(0.12);
  });

  it("shows the content at once under reduced motion or with isAnimated off", () => {
    state.isReduced = true;
    const { unmount } = render(<Reveal>Calm</Reveal>);
    expect(state.props["initial"]).toBe(false);
    unmount();
    state.isReduced = false;
    render(<Reveal isAnimated={false}>Off</Reveal>);
    expect(state.props["initial"]).toBe(false);
    expect(screen.getByText("Off").dataset["slot"]).toBe("reveal");
  });
});
