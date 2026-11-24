/**
 * Stackra file contract:
 * Purpose: `Note`, the one model of the example service: a titled text a tenant's user wrote. Key `notes.note`, table
 *          `notes.notes`, public ids `not_…`.
 * Boundary: data and rules of the fields. Tenant-owned through `BelongsToTenant`: the row carries `tenant_id` from the
 *           running call (never from input), and the database forces a row-level policy on it, so another tenant's notes
 *           are invisible even to a query that forgets a filter.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4 and 20); ADR 0321 and 0323 d1 (`BelongsToTenant`); ADR 0239 (equality on
 *                     `tenant_id`); ADR 0305 (one declaration per file).
 */
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Str } from "@stackra/validation";

/** A titled text, one row of `notes.notes`. */
export class Note extends Model.with(HasPublicId("not"), BelongsToTenant, Timestamps) {
  /** The note's title, 1 to 120 characters. */
  @Str({
    min: 1,
    max: 120,
  })
  title!: string;

  /** The note's text, up to 2000 characters; empty when the note is only a title. */
  @Str({ max: 2000 })
  body!: string;
}
