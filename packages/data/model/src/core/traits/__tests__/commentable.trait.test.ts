/**
 * Stackra file contract:
 * Purpose: unit tests of `Commentable` and `HasAttachments`: neither adds a field, and each marks the model in the
 *          trait registry.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0225 (decision 3); ADR 0321.
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { Commentable } from "#core/traits/commentable.trait";
import { HasAttachments } from "#core/traits/has-attachments.trait";

class Matter extends Model.with(Commentable, HasAttachments) {}

describe("Commentable", () => {
  it("adds no field and marks the model, beside HasAttachments", () => {
    expect(Object.keys(new Matter())).toEqual([]);
    expect(traitsOf(Matter).map((trait) => trait.name)).toEqual(["commentable", "has_attachments"]);
  });
});
