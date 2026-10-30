/**
 * Stackra file contract:
 * Purpose: proves the scroll spy's decision: the last heading above the activation line, the first before any, the
 *          last at the bottom of the page, the clicked one while locked, and no flip-flop on the line (hysteresis).
 * Boundary: pure.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
import { activeSectionIndex } from "#src/components/toc-rail/active-section-index.function";

describe("activeSectionIndex", () => {
  it("picks the last heading whose top is above the activation line", () => {
    expect(activeSectionIndex({ tops: [-400, -20, 150, 900], line: 200, isAtBottom: false })).toBe(
      2,
    );
    expect(activeSectionIndex({ tops: [-400, -20, 250, 900], line: 200, isAtBottom: false })).toBe(
      1,
    );
  });

  it("picks the first section before any heading reaches the line", () => {
    expect(activeSectionIndex({ tops: [300, 900], line: 200, isAtBottom: false })).toBe(0);
  });

  it("picks the last section at the very bottom of the page", () => {
    expect(activeSectionIndex({ tops: [-900, -300, 400, 700], line: 200, isAtBottom: true })).toBe(
      3,
    );
  });

  it("skips headings missing from the page", () => {
    expect(activeSectionIndex({ tops: [-900, -300, undefined], line: 200, isAtBottom: true })).toBe(
      1,
    );
  });

  it("keeps the clicked section while a jump is locked to it", () => {
    expect(
      activeSectionIndex({ tops: [-900, -300, 100, 700], line: 200, isAtBottom: false, locked: 3 }),
    ).toBe(3);
    expect(
      activeSectionIndex({ tops: [-900, -300, 100, 700], line: 200, isAtBottom: true, locked: 1 }),
    ).toBe(1);
  });

  it("does not flip while a heading rests on the line (hysteresis)", () => {
    // Forward: heading 2 has only just touched the line.
    expect(
      activeSectionIndex({
        tops: [-400, -20, 197, 900],
        line: 200,
        isAtBottom: false,
        previous: 1,
      }),
    ).toBe(1);
    expect(
      activeSectionIndex({
        tops: [-400, -20, 180, 900],
        line: 200,
        isAtBottom: false,
        previous: 1,
      }),
    ).toBe(2);
    // Back: heading 2 has only just dropped under the line.
    expect(
      activeSectionIndex({
        tops: [-400, -20, 203, 900],
        line: 200,
        isAtBottom: false,
        previous: 2,
      }),
    ).toBe(2);
    expect(
      activeSectionIndex({
        tops: [-400, -20, 230, 900],
        line: 200,
        isAtBottom: false,
        previous: 2,
      }),
    ).toBe(1);
  });

  it("moves forward monotonically as the page scrolls down", () => {
    const heads = [0, 500, 1000, 1500, 2000];
    let previous: number | undefined;
    const seen: number[] = [];
    for (let y = 0; y <= 2000; y += 37) {
      previous = activeSectionIndex({
        tops: heads.map((top) => top - y),
        line: 200,
        isAtBottom: false,
        previous,
      });
      seen.push(previous);
    }
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
    expect(seen.at(-1)).toBe(4);
  });
});
