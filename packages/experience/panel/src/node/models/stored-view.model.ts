/**
 * Stackra file contract:
 * Purpose: `StoredView`, the persisted saved view `DatabaseViewStoreDriver` keeps: one person's view of a resource's
 *          list, private, shared with a role or with the owner's whole scope.
 * Boundary: data and indexes. Key `panel.stored_view`, table `panel.stored_views` (the package's Postgres schema), public
 *           ids `view_…`. Tenant-owned through @stackra/tenancy's `BelongsToTenant`, so a session reads and writes its
 *           own scope's views under the forced equality policy; `Versioned` gives the optimistic concurrency of a shared
 *           view. It stores declared keys only (filter values, sort, columns, grouping, totals), never a query. The ORM
 *           loads rows without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0271 (decisions 2, 3 and 8); ADR 0307 (rule 9); ADR 0359 (decision 14); ADR 0294 (decisions 4,
 *                     20 and 27); ADR 0321 and 0323 d1 (`BelongsToTenant` is tenancy's).
 */
import { Enum } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Index, Model, Timestamps, Versioned } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Field, Str } from "@stackra/validation";
import { z } from "zod";

import { ViewLayout } from "#core/enums/view-layout.enum";
import { ViewSharing } from "#core/enums/view-sharing.enum";
import type { SavedViewGroup } from "#core/schemas/saved-view-group.schema";
import type { SavedViewSort } from "#core/schemas/saved-view-sort.schema";
import type { SavedViewTotal } from "#core/schemas/saved-view-total.schema";

/** One stored saved view. */
@Index(["tenantId", "resource", "owner"])
@Index(["tenantId", "resource", "sharing"])
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class StoredView extends Model.with(
  HasPublicId("view"),
  BelongsToTenant,
  Versioned,
  Timestamps,
) {
  /** The resource key the view lists (`orders.order`). */
  @Str({ max: 200 })
  resource!: string;

  /** The name the owner gave it. */
  @Str({ max: 120 })
  name!: string;

  /** The owner's principal id. */
  @Str({ max: 64 })
  owner!: string;

  /** Who sees it: the owner, a role's holders or the whole scope. */
  // reason: the closed set of `ViewSharing` codes
  @Field(z.enum(Enum.values(ViewSharing)))
  sharing!: ViewSharing;

  /** The role key of a role copy. */
  @Str({ max: 200 })
  role!: string | null;

  /** How the rows are drawn. */
  // reason: the closed set of `ViewLayout` codes
  @Field(z.enum(Enum.values(ViewLayout)))
  layout!: ViewLayout;

  /** The row path a board groups by or a calendar places by. */
  @Str({ max: 200 })
  layoutBy!: string | null;

  /** The sort, when it differs from the table's default. */
  sort!: SavedViewSort | null;

  /** The group key and its sub-group key. */
  group!: SavedViewGroup | null;

  /** The totals per group. */
  totals!: SavedViewTotal[];

  /** The filter values by row path. */
  filter!: Record<string, Json>;

  /** The row paths shown, in order. */
  columns!: string[] | null;
}

/** The insert-optional fields of `StoredView`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: the `[OptionalProps]` augmentation is written by hand so `insert` may leave out what the traits fill; remove
// it once gen writes the entity files (STA-339).
export interface StoredView {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?: "id" | "tenantId" | "version" | "createdAt" | "updatedAt";
}
