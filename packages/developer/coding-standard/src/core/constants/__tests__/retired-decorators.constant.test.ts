/**
 * Stackra file contract:
 * Purpose: unit tests of `RETIRED_DECORATORS`: it is frozen and sorted, holds the DI decorators, and shares no name
 *          with the v3 field, method and class-facet vocabulary or with a kind base.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { KIND_BASES } from "#core/constants/kind-bases.constant";
import { RETIRED_DECORATORS } from "#core/constants/retired-decorators.constant";

// The decorator vocabulary of ADR 0294 R6 (field, method and class facet), which must stay allowed.
const ALLOWED = [
  "Str",
  "Int",
  "Num",
  "List",
  "Trim",
  "Lowercase",
  "Hidden",
  "Visible",
  "ManyToOne",
  "OneToMany",
  "ManyToMany",
  "OneToOne",
  "Env",
  "Secret",
  "Setting",
  "Renamed",
  "Field",
  "Classified",
  "Step",
  "Transition",
  "Index",
  "Searchable",
  "Auditable",
  "AccessLogged",
  "Lifetime",
  "Replaces",
];

describe("RETIRED_DECORATORS", () => {
  it("is frozen and sorted", () => {
    expect(Object.isFrozen(RETIRED_DECORATORS)).toBe(true);
    expect([...RETIRED_DECORATORS].sort()).toEqual(RETIRED_DECORATORS);
  });

  it("holds the DI decorators", () => {
    expect(RETIRED_DECORATORS).toEqual(
      expect.arrayContaining(["Inject", "Injectable", "Provider"]),
    );
  });

  it("never names an allowed decorator", () => {
    for (const name of ALLOWED) expect(RETIRED_DECORATORS).not.toContain(name);
  });

  it("does not repeat a kind base, which no-kind-decorator refuses on its own", () => {
    const bases = new Set(Object.values(KIND_BASES).flat());
    for (const name of RETIRED_DECORATORS) expect(bases.has(name)).toBe(false);
  });
});
