/**
 * Stackra file contract:
 * Purpose: unit tests of `HasCorrections`: an original row corrects nothing, and it applies beside `AppendOnly`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0321 (2026-10-24 amendment).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { AppendOnly } from "#core/traits/append-only.trait";
import { HasCorrections } from "#core/traits/has-corrections.trait";

class TimeEntry extends Model.with(AppendOnly, HasCorrections) {}

describe("HasCorrections", () => {
  it("adds a null corrects beside AppendOnly", () => {
    expect(new TimeEntry().corrects).toBeNull();
    expect(traitsOf(TimeEntry).map((trait) => trait.name)).toEqual([
      "append_only",
      "has_corrections",
    ]);
  });
});
