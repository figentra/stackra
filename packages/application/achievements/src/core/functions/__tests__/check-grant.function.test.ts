/**
 * Stackra file contract:
 * Purpose: unit tests of `checkGrant`: an archived kind and another recipient model are refused; a levelled kind needs
 *          one of its levels; an ascending kind needs a level above the highest live one, a non-ascending kind does
 *          not; a once-per-period kind needs a period not yet awarded; a plain kind grants.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decisions 2 and 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { GrantRefusal } from "#contracts/index";
import { checkGrant } from "#core/functions/check-grant.function";

/** A plain, active kind over members. */
const PLAIN = {
  isActive: true,
  recipientModel: "workforce.member",
  levels: [],
  isAscending: false,
  isOncePerPeriod: false,
};

/** A grading with ascending levels. */
const GRADING = { ...PLAIN, levels: ["white", "yellow", "blue"], isAscending: true };

/** A grant to a member with no level or period. */
const GRANT = { recipientModel: "workforce.member", level: null, period: null };

describe(checkGrant, () => {
  it("grants a plain kind and refuses an archived kind or another model", () => {
    expect(checkGrant(PLAIN, GRANT, [])).toBeNull();
    expect(checkGrant({ ...PLAIN, isActive: false }, GRANT, [])).toBe(GrantRefusal.KindArchived);
    expect(checkGrant(PLAIN, { ...GRANT, recipientModel: "school.student" }, [])).toBe(
      GrantRefusal.RecipientMismatch,
    );
  });

  it("needs one of a levelled kind's levels", () => {
    expect(checkGrant(GRADING, GRANT, [])).toBe(GrantRefusal.LevelRequired);
    expect(checkGrant(GRADING, { ...GRANT, level: "black" }, [])).toBe(GrantRefusal.LevelUnknown);
    expect(checkGrant(GRADING, { ...GRANT, level: "white" }, [])).toBeNull();
  });

  it("needs an ascending kind's level above the highest live one", () => {
    const live = [{ level: "yellow", period: null }];
    expect(checkGrant(GRADING, { ...GRANT, level: "yellow" }, live)).toBe(
      GrantRefusal.LevelNotHigher,
    );
    expect(checkGrant(GRADING, { ...GRANT, level: "white" }, live)).toBe(
      GrantRefusal.LevelNotHigher,
    );
    expect(checkGrant(GRADING, { ...GRANT, level: "blue" }, live)).toBeNull();
    expect(
      checkGrant({ ...GRADING, isAscending: false }, { ...GRANT, level: "white" }, live),
    ).toBeNull();
  });

  it("needs a once-per-period kind's period, once", () => {
    const monthly = { ...PLAIN, isOncePerPeriod: true };
    expect(checkGrant(monthly, GRANT, [])).toBe(GrantRefusal.PeriodRequired);
    expect(checkGrant(monthly, { ...GRANT, period: " " }, [])).toBe(GrantRefusal.PeriodRequired);
    const live = [{ level: null, period: "2026-09" }];
    expect(checkGrant(monthly, { ...GRANT, period: "2026-09" }, live)).toBe(
      GrantRefusal.PeriodTaken,
    );
    expect(checkGrant(monthly, { ...GRANT, period: "2026-10" }, live)).toBeNull();
  });
});
