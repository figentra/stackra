/**
 * Stackra file contract:
 * Purpose: `Synonym`, one equivalence set of a tenant's search synonyms: the index and language it applies to and the
 *          terms that find each other (`sofa`, `couch`, `settee`).
 * Boundary: data and indexes. Key `data_maintenance.synonym`, table `data_maintenance.synonyms` (the package's Postgres schema), public ids
 *           `syn_…`. Tenant-owned through @stackra/tenancy's `BelongsToTenant`, so a session reads and writes its own
 *           tenant's sets under the forced equality policy and never another's. `SearchIndex` reads the sets through
 *           `DatabaseSynonymSourceDriver` and expands each phrase word with the other terms of its sets. The ORM loads
 *           rows without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 5); ADR 0294 (decisions 4, 20 and 27); ADR 0321 and 0323 d1 (`BelongsToTenant`
 *                     is tenancy's); ADR 0239 (equality on `tenant_id`); ADR 0403.
 */
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Index, Model, Timestamps } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Field, Str } from "@stackra/validation";

import { SYNONYM_FIELDS } from "#node/constants/synonym-fields-schema.constant";

/** One stored synonym set. */
@Index(["tenantId", "indexName", "language"])
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Synonym extends Model.with(HasPublicId("syn"), BelongsToTenant, Timestamps) {
  /** The index (the searched model's table, bare or schema-qualified) the set applies to. */
  @Str({ max: 120 })
  indexName!: string;

  /** The language subtag (`ar`, `en`) the set applies to. */
  @Str({ max: 3 })
  language!: string;

  /** The terms that find each other, two to sixteen. */
  // reason: the term rules (no comma, `#` or line break) are the shipped synonym line's
  @Field(SYNONYM_FIELDS.shape.terms)
  terms!: string[];
}

/** The insert-optional fields of `Synonym`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: the `[OptionalProps]` augmentation is written by hand so `insert` may leave out what the traits fill; remove
// it once gen writes the entity files (STA-339).
export interface Synonym {
  /** The fields an insert may leave out: minted ids and trait-filled columns. */
  [OptionalProps]?: "id" | "tenantId" | "createdAt" | "updatedAt";
}
