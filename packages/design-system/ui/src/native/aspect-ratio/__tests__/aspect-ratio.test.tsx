/**
 * Stackra file contract:
 * Purpose: proves the native AspectRatio hands its ratio (1 by default) to the box's `aspectRatio` style.
 * Boundary: React Native's View is a recording stand-in.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { AspectRatio } from "#native/aspect-ratio/aspect-ratio";

const state = vi.hoisted(() => ({ views: [] as Record<string, unknown>[] }));

vi.mock("react-native", () => ({
  View: (props: Record<string, unknown>) => {
    state.views.push(props);
    return null;
  },
}));

describe("AspectRatio (native)", () => {
  it("sets the aspect ratio style", () => {
    render(<AspectRatio ratio={4 / 3} />);
    render(<AspectRatio />);
    expect(state.views.map((view) => view["style"])).toEqual([
      { aspectRatio: 4 / 3 },
      { aspectRatio: 1 },
    ]);
  });
});
