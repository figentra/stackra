/**
 * Stackra file contract:
 * Purpose: proves `withDefaults` renders the part it copies with the defaults under the caller's props, lets a passed
 *          prop win (an explicit `undefined` included), keeps the part's `displayName` and leaves the part unchanged.
 * Boundary: unit; the copy is called as a function, so the element it returns is checked without a renderer.
 * Runtime: node
 * Governing contract: ADR 0329 (motion layer); ADR 0022 (test placement).
 */
// @covers sta-430:FR-006 sta-430:P-002
import type { ReactElement } from "react";

import { withDefaults } from "#native/chart-series/with-defaults.function";

interface SeriesProps {
  points: number[];
  animate?: { type: "timing"; duration: number } | undefined;
}

const Series = Object.assign((_props: SeriesProps) => null, { displayName: "HeroUINative.Series" });
const ANIMATE = { type: "timing", duration: 400 } as const;

/** The element a copy returns for `props`. */
function render(copy: typeof Series, props: SeriesProps): ReactElement<SeriesProps> {
  return (copy as unknown as (props: SeriesProps) => ReactElement<SeriesProps>)(props);
}

describe("withDefaults", () => {
  it("renders the part with the defaults under the caller's props", () => {
    const element = render(withDefaults(Series, { animate: ANIMATE }), { points: [1] });
    expect(element.type).toBe(Series);
    expect(element.props).toEqual({ animate: ANIMATE, points: [1] });
  });

  it("lets a passed prop win, an explicit undefined included", () => {
    const copy = withDefaults(Series, { animate: ANIMATE });
    const own = { type: "timing", duration: 100 } as const;
    expect(render(copy, { points: [], animate: own }).props.animate).toBe(own);
    expect(render(copy, { points: [], animate: undefined }).props.animate).toBeUndefined();
  });

  it("keeps the part's displayName and leaves the part unchanged", () => {
    const copy = withDefaults(Series, { animate: ANIMATE });
    expect(copy).not.toBe(Series);
    expect(copy.displayName).toBe("HeroUINative.Series");
    expect(Object.keys(Series)).toEqual(["displayName"]);
  });
});
