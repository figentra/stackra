/**
 * Stackra file contract:
 * Purpose: `ListActivityInput`, the input of `activity.activity_entry.list@1`: the opaque cursor of the page to read and
 *          its size.
 * Boundary: a shape class in its own file with the two fields `CursorInput` gives, declared here rather than inherited
 *           so gen compiles their rules (STA-2805: an inherited field's rules are dropped): `limit` 1 to 100, 20 by
 *           default, and the cursor the previous page handed out.
 * Runtime: node
 * Governing contract: ADR 0294; ADR 0305; the HTTP conventions (cursor pagination).
 */
import { Int, Schema, Str } from "@stackra/validation";

/** Which page of the feed to read. */
export class ListActivityInput extends Schema {
  /** How many entries to return, 1 to 100. */
  @Int({
    min: 1,
    max: 100,
  })
  limit = 20;

  /** The opaque cursor the previous page handed out; absent for the first page. */
  @Str({
    min: 1,
    max: 512,
  })
  cursor?: string;
}
