/**
 * Stackra file contract:
 * Purpose: `LinkType`, the ORM column type of a `Link<T>` field: a `varchar` holding the target's public id in the
 *          database, a `Link` in the model. Gen's entity metadata writes `{ type: new LinkType("catalogue.variant") }`
 *          for each cross-module relation.
 * Boundary: a MikroORM custom type, so the target's metadata never enters this module's ORM: no foreign key, no join,
 *           no populate. It takes a `Link` or a raw id on the way in, so a filter and `em.create` accept the id. The
 *           column is wide enough for the longest public id (a 6-letter prefix, `_`, 26 characters).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 28); ADR 0135 (public id format); the STA-335 entity-schema spike.
 */
import { Type } from "@mikro-orm/core";

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

  constructor(model: string) {
    super();
    this.model = model;
  }

  /** A link or a raw id to the stored id. */
  override convertToDatabaseValue(value: LinkValue): string | null | undefined {
    return value instanceof Link ? value.id : value;
  }

  /** A stored id to a `Link` of this type's model. */
  override convertToJSValue(value: LinkValue): LinkValue {
    return typeof value === "string" ? new Link(this.model, value) : value;
  }

  /** Links compare by their stored ids. */
  override compareAsType(): string {
    return "string";
  }

  /** A link serializes as its id. */
  override toJSON(value: LinkValue): string | null | undefined {
    return value instanceof Link ? value.id : value;
  }

  /** `varchar(33)`: the longest public id. */
  override getColumnType(): string {
    return "varchar(33)";
  }
}
