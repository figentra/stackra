/**
 * Stackra file contract:
 * Purpose: `LinkType`, the ORM column type of a `Link<T>` field: the target's public id in the database, a `Link` in
 *          the model. Gen's entity metadata writes `{ type: new LinkType("catalogue.variant") }` for each cross-module
 *          relation, or `new LinkType("catalogue.variant", "var")` for a native `uuid` column, whose codec strips and
 *          adds the target's prefix.
 * Boundary: a MikroORM custom type, so the target's metadata never enters this module's ORM: no foreign key, no join,
 *           no populate. It takes a `Link` or a raw id on the way in, so a filter and `em.create` accept the id. The
 *           `varchar(33)` column fits the longest public id (a 6-letter prefix, `_`, 26 characters).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 28); ADR 0135 (public id format); the STA-335 entity-schema spike.
 */
import { Type } from "@mikro-orm/core";

import { publicIdToUuid } from "#core/functions/public-id-to-uuid.function";
import { uuidToPublicId } from "#core/functions/uuid-to-public-id.function";
import { Link } from "#core/values/link.value";

/** A link value as the ORM sees it: a link, a raw id, or nothing. */
type LinkValue = Link<{ id: string }> | string | null | undefined;

/**
 * The column type of a link to `model`.
 *
 * @example
 * variant: { type: new LinkType("catalogue.variant"), fieldName: "variant_id", index: true },
 */
export class LinkType extends Type<LinkValue, string | null | undefined> {
  /** The target's model key (`catalogue.variant`). */
  readonly model: string;

  /** The target's public-id prefix when the column is a native `uuid`; `undefined` for `varchar(33)`. */
  readonly prefix: string | undefined;

  /**
   * @param model - the target's model key (`catalogue.variant`).
   * @param prefix - the target's prefix (`var`) for a native `uuid` column (ADR 0135, 2026-10-28 amendment).
   */
  constructor(model: string, prefix?: string) {
    super();
    this.model = model;
    this.prefix = prefix;
  }

  /** A link or a raw id to the stored id (its UUID in a `uuid` column). */
  override convertToDatabaseValue(value: LinkValue): string | null | undefined {
    const id = value instanceof Link ? value.id : value;
    return this.prefix === undefined || typeof id !== "string" || !id.includes("_")
      ? id
      : publicIdToUuid(id);
  }

  /** A stored id to a `Link` of this type's model. */
  override convertToJSValue(value: LinkValue): LinkValue {
    if (typeof value !== "string") return value;
    const id =
      this.prefix === undefined || value.includes("_") ? value : uuidToPublicId(this.prefix, value);
    return new Link(this.model, id);
  }

  /** Links compare by their stored ids. */
  override compareAsType(): string {
    return "string";
  }

  /** A link serializes as its id. */
  override toJSON(value: LinkValue): string | null | undefined {
    return value instanceof Link ? value.id : value;
  }

  /** `uuid` with a prefix, else `varchar(33)`: the longest public id. */
  override getColumnType(): string {
    return this.prefix === undefined ? "varchar(33)" : "uuid";
  }
}
