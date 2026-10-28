/**
 * Stackra file contract:
 * Purpose: unit tests of `deleteFilters`: the `deleted` filter covers the `SoftDeletes` entities and the `archived`
 *          filter the `Archivable` ones, each on by default and hiding the rows whose field is set; a filter no entity
 *          needs is left out.
 * Boundary: test only; the entity schemas are stand-ins carrying a class and its name.
 * Runtime: node (vitest)
 * Governing contract: ADR 0134 (decision 4); ADR 0022; ADR 0269.
 */
import type { EntitySchema } from "@mikro-orm/core";
import { Archivable, HasPublicId, Model, SoftDeletes } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { deleteFilters } from "#core/functions/delete-filters.function";

class Note extends Model.with(HasPublicId("not"), SoftDeletes) {}

class Project extends Model.with(HasPublicId("prj"), Archivable) {}

class Order extends Model.with(HasPublicId("ord")) {}

/** A stand-in schema of `type`. */
function schemaOf(type: { readonly name: string }): EntitySchema {
  return { meta: { class: type, className: type.name } } as unknown as EntitySchema;
}

describe("deleteFilters", () => {
  it("limits each filter to the entities with its trait", () => {
    expect(deleteFilters([schemaOf(Note), schemaOf(Project), schemaOf(Order)])).toEqual({
      deleted: { cond: { deletedAt: null }, default: true, entity: ["Note"] },
      archived: { cond: { archivedAt: null }, default: true, entity: ["Project"] },
    });
  });

  it("leaves out a filter no entity needs", () => {
    expect(deleteFilters(new Set([schemaOf(Order)]))).toEqual({});
  });
});
