/**
 * Stackra file contract:
 * Purpose: unit tests of `planUpgradeCodemods`: only the codemods after `from` and at or before `to`, oldest release
 *          first with the registry order breaking a tie, `only` narrowing them, and an unknown id refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 2); STA-145.
 */
import { describe, expect, it } from "@stackra/testing";

import { planUpgradeCodemods } from "#node/upgrade/functions/plan-upgrade-codemods.function";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

const codemod = (id: string, version: string): UpgradeCodemod => ({
  id,
  version,
  title: id,
  note: id,
  source: id,
});

const REGISTRY = [
  codemod("b-030", "0.30.0"),
  codemod("a-004", "0.4.0"),
  codemod("a-030", "0.30.0"),
  codemod("c-033", "0.33.0"),
  codemod("d-100", "1.0.0"),
];

describe("planUpgradeCodemods", () => {
  it("keeps the releases after from and up to to, oldest first, registry order on a tie", () => {
    expect(planUpgradeCodemods(REGISTRY, "0.4.0", "0.33.1").map((entry) => entry.id)).toEqual([
      "b-030",
      "a-030",
      "c-033",
    ]);
    expect(planUpgradeCodemods(REGISTRY, "0.3.0", "0.30.0").map((entry) => entry.id)).toEqual([
      "a-004",
      "b-030",
      "a-030",
    ]);
    expect(planUpgradeCodemods(REGISTRY, "0.33.0", "0.33.1")).toEqual([]);
  });

  it("narrows to --only and refuses an unknown id, naming the known ones", () => {
    expect(
      planUpgradeCodemods(REGISTRY, "0.3.0", "0.33.1", ["c-033", "a-004"]).map((entry) => entry.id),
    ).toEqual(["a-004", "c-033"]);
    expect(() => planUpgradeCodemods(REGISTRY, "0.3.0", "0.33.1", ["nope"])).toThrow(
      "unknown codemod nope; codemods: b-030, a-004, a-030, c-033, d-100",
    );
  });
});
