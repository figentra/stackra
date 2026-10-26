/**
 * Stackra file contract:
 * Purpose: `CatalogueVersion`, one dated version of a plan-catalogue admin record (`plan-catalogue:<product>`,
 *          `price-list:<product>`, `offer:<name>`, `fee-schedule:<name>`, `rate-card:<name>`): its rows, the date it
 *          applies from, whether it is a discount, and who proposed and approved it.
 * Boundary: a type only. The rows are the record's data as its seed pack and the admin hold them; each record kind's
 *           reader (`planCatalogueOf`, `@stackra/pricing`'s readers) checks them. Versions are never edited: a change
 *           is a new version.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decisions 1 to 4); config-model section 2.
 */
import type { Json } from "@stackra/contracts";

import type { CatalogueVersionState } from "#contracts/enums/catalogue-version-state.enum";

/** One version of one record. */
export interface CatalogueVersion {
  /** The record key (`plan-catalogue:commerce`). */
  readonly key: string;

  /** The record kind (`plan-catalogue`, `price-list`, `offer`, `fee-schedule`, `rate-card`). */
  readonly kind: string;

  /** 1 for the first version, one more for each change. */
  readonly version: number;

  /** The record's rows. */
  readonly rows: readonly Readonly<Record<string, Json>>[];

  /** The first instant the version applies to a term that starts (a subscription's start or renewal). */
  readonly effectiveFrom: Date;

  /** Whether the change lowers a price or grants a benefit, so it needs a second approver. */
  readonly discount: boolean;

  /** Where the version stands. */
  readonly state: CatalogueVersionState;

  /** The principal who proposed it, or the seed pack key (`seed-pack:commerce`) for a seeded version. */
  readonly proposedBy: string;

  /** When it was proposed. */
  readonly proposedAt: Date;

  /** The principal who approved or rejected it; absent while pending. */
  readonly decidedBy?: string;
}
