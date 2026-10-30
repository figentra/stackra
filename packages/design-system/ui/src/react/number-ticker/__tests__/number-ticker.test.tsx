/**
 * Stackra file contract:
 * Purpose: proves the web `NumberTicker` counts from `from` to its value on animation frames in the provider's locale,
 *          reads the final value once for assistive technology, and shows the value at once below the full motion
 *          level.
 * Boundary: jsdom; `requestAnimationFrame` is a stand-in driven by hand, and the motion level comes from the context.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { NumberTicker } from "#react/number-ticker/number-ticker";

const frames: ((time: number) => void)[] = [];

/** The design-system state in German with the given motion. */
const state = (resolvedMotion: DesignSystemState["resolvedMotion"]) =>
  ({ locale: "de-DE", resolvedMotion }) as DesignSystemState;

describe("NumberTicker (web)", () => {
  beforeEach(() => {
    frames.length = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: (time: number) => void) =>
      frames.push(callback),
    );
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("counts from the start to the value and reads only the value", () => {
    const { container } = render(
      <DesignSystemContext value={state("full")}>
        <NumberTicker value={12_500} duration={1000} />
      </DesignSystemContext>,
    );
    const [shown, spoken] = container.querySelectorAll("span > span");
    expect(shown?.textContent).toBe("0");
    expect(shown?.getAttribute("aria-hidden")).toBe("true");
    expect(spoken?.textContent).toBe("12.500");
    act(() => frames.shift()?.(0));
    act(() => frames.shift()?.(1000));
    expect(shown?.textContent).toBe("12.500");
  });

  it("shows the value at once at the reduced level", () => {
    const { container } = render(
      <DesignSystemContext value={state("reduced")}>
        <NumberTicker value={42} />
      </DesignSystemContext>,
    );
    expect(container.querySelector("[aria-hidden]")?.textContent).toBe("42");
  });
});
