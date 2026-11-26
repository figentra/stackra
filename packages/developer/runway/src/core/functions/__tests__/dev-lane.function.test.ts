/**
 * Stackra file contract:
 * Purpose: unit tests of `devLane`: the variable `lanes.from` names wins; otherwise the repository's row of
 *          `lanes.repos` (by product key, else project) times `lanes.worktrees` plus `STACKRA_WORKTREE`; lanes off and
 *          an unlisted repository are lane 0; a value that is not a whole number, and a worktree past the table, are
 *          refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1); STA-863; STA-2840.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { devLane } from "#core/functions/dev-lane.function";

/** A root runway of product `key` with the given dev lanes block. */
const root = (key: string | undefined, lanes: Record<string, unknown> | undefined) => ({
  project: "acme-platform",
  ...(key === undefined ? {} : { product: { key } }),
  environments: { dev: lanes === undefined ? {} : { lanes } },
});

describe("devLane", () => {
  it("takes the lane from STACKRA_LANE first", () => {
    expect(devLane(root("pay", { repos: { os: 0, pay: 1 } }), { STACKRA_LANE: "3" })).toBe(3);
  });

  it("reads the variable lanes.from names", () => {
    expect(devLane(root("pay", { from: "MY_LANE" }), { MY_LANE: "2", STACKRA_LANE: "7" })).toBe(2);
  });

  it("derives the lane from the repository table when no variable is set", () => {
    const lanes = { repos: { os: 0, pay: 1, tamo: 2 } };
    expect(devLane(root("os", lanes), {})).toBe(0);
    expect(devLane(root("pay", lanes), {})).toBe(10);
    expect(devLane(root("tamo", lanes), { STACKRA_WORKTREE: "4" })).toBe(24);
    expect(devLane(root("tamo", { ...lanes, worktrees: 5 }), { STACKRA_WORKTREE: "4" })).toBe(14);
  });

  it("falls back to the project name when the runway has no product key", () => {
    expect(devLane(root(undefined, { repos: { "acme-platform": 3 } }), {})).toBe(30);
  });

  it("is lane 0 for an unlisted repository, no table, lanes off and an empty variable", () => {
    expect(devLane(root("pay", { repos: { os: 0 } }), {})).toBe(0);
    expect(devLane(root("pay", undefined), {})).toBe(0);
    expect(devLane(root("pay", { enabled: false, repos: { pay: 1 } }), { STACKRA_LANE: "4" })).toBe(
      0,
    );
    expect(devLane(root("pay", { repos: { pay: 1 } }), { STACKRA_LANE: " " })).toBe(10);
    expect(devLane({}, {})).toBe(0);
  });

  it("refuses a lane or worktree that is not a whole number, and a worktree past the table", () => {
    expect(() => devLane(root("pay", {}), { STACKRA_LANE: "one" })).toThrow(RunwayUnresolvedError);
    expect(() => devLane(root("pay", {}), { STACKRA_LANE: "-1" })).toThrow(/whole number/);
    expect(() => devLane(root("pay", { repos: { pay: 1 } }), { STACKRA_WORKTREE: "x" })).toThrow(
      /STACKRA_WORKTREE/,
    );
    expect(() =>
      devLane(root("pay", { repos: { pay: 1 }, worktrees: 3 }), { STACKRA_WORKTREE: "3" }),
    ).toThrow(/below environments.dev.lanes.worktrees/);
  });
});
