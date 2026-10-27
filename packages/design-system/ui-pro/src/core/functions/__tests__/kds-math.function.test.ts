/**
 * Stackra file contract:
 * Purpose: unit tests of the KDS math: `kdsAgeTone` picks the highest step reached in any order, `default` below
 *          every step; `allDayCounts` sums pending lines by name and leaves out done, held lines and held tickets.
 * Boundary: test only; the steps and tickets are test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0310 (decision 3).
 */
import { allDayCounts } from "#core/functions/all-day-counts.function";
import { kdsAgeTone } from "#core/functions/kds-age-tone.function";

const steps = [
  { fromMinutes: 10, tone: "danger" as const },
  { fromMinutes: 5, tone: "warning" as const },
];

describe("KDS math", () => {
  it("colours a ticket by the highest age step it reached", () => {
    expect(kdsAgeTone(2, steps)).toBe("default");
    expect(kdsAgeTone(5, steps)).toBe("warning");
    expect(kdsAgeTone(12, steps)).toBe("danger");
    expect(kdsAgeTone(12, [])).toBe("default");
  });

  it("counts the lines still to make, by name", () => {
    expect(
      allDayCounts([
        {
          id: "a",
          title: "T1",
          sentAt: 0,
          items: [
            { id: "1", quantity: 2, name: "Burger" },
            { id: "2", quantity: 1, name: "Fries", isDone: true },
            { id: "3", quantity: 1, name: "Cake", isHeld: true },
          ],
        },
        { id: "b", title: "T2", sentAt: 0, items: [{ id: "4", quantity: 3, name: "Burger" }] },
        {
          id: "c",
          title: "T3",
          sentAt: 0,
          isHeld: true,
          items: [{ id: "5", quantity: 9, name: "Soup" }],
        },
      ]),
    ).toEqual([["Burger", 5]]);
  });
});
