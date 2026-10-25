/**
 * Stackra file contract:
 * Purpose: unit tests of `findEvent`: it matches by class and by the expected fields only, compares dates by time and
 *          nested arrays and objects structurally, and finds nothing for a wrong value or class.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { DomainEvent } from "#core/index";
import { findEvent } from "#testing/functions/find-event.function";

class PointsEarned extends DomainEvent {
  points!: number;

  at!: Date;

  lines!: { sku: string }[];
}

class OrderPaid extends DomainEvent {}

const earned = Object.assign(new PointsEarned(), {
  points: 200,
  at: new Date("2026-10-24T00:00:00Z"),
  lines: [{ sku: "a" }],
});

describe(findEvent, () => {
  it("matches by class and the given fields only", () => {
    expect(findEvent([earned], PointsEarned)).toBe(earned);
    expect(findEvent([earned], PointsEarned, { points: 200 })).toBe(earned);
    expect(
      findEvent([earned], PointsEarned, {
        at: new Date("2026-10-24T00:00:00Z"),
        lines: [{ sku: "a" }],
      }),
    ).toBe(earned);
  });

  it("finds nothing for another value or class", () => {
    expect(findEvent([earned], PointsEarned, { points: 100 })).toBeUndefined();
    expect(findEvent([earned], PointsEarned, { lines: [{ sku: "b" }] })).toBeUndefined();
    expect(findEvent([earned], PointsEarned, { lines: [] })).toBeUndefined();
    expect(findEvent([earned], OrderPaid)).toBeUndefined();
  });
});
