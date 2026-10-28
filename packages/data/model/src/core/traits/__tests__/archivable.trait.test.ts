/**
 * Stackra file contract:
 * Purpose: unit tests of `Archivable`: a created row is active (`archivedAt` null) and the trait is registered for
 *          @stackra/database to read.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0134 (decision 4); ADR 0321.
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { Archivable } from "#core/traits/archivable.trait";

class Project extends Model.with(Archivable) {}

describe("Archivable", () => {
  it("starts active and is registered", () => {
    expect(new Project().archivedAt).toBeNull();
    expect(traitsOf(Project).map((trait) => trait.name)).toEqual(["archivable"]);
  });
});
