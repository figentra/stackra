/**
 * Stackra file contract:
 * Purpose: `PublicIdType`, the ORM column type of a `HasPublicId` primary key (and a same-module foreign key to one)
 *          stored as a native Postgres `uuid`: the codec strips the prefix on the way in and adds the model's prefix
 *          on the way out, so the model only ever sees `ord_01jab3k4…`.
 * Boundary: a MikroORM custom type; gen's entity metadata writes `{ type: new PublicIdType("ord") }` when the member
 *           compiles its migrations with `publicIds: "uuid"`. A raw UUID going in passes unchanged, so a filter on a
 *           stored value still works; anything else that is not a public id is refused.
 * Runtime: node
 * Governing contract: ADR 0135 (2026-10-28 amendment: native `uuid` storage, the prefix in the codec); ADR 0134
 *                     (2026-10-28 amendment); owner data-layer decision 1.
 */
import { Type } from "@mikro-orm/core";

import { publicIdToUuid } from "#core/functions/public-id-to-uuid.function";
import { uuidToPublicId } from "#core/functions/uuid-to-public-id.function";

/** A public id as the ORM sees it. */
type IdValue = string | null | undefined;

/** A stored UUID: 36 characters with hyphens. */
const STORED = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

/**
 * The column type of a public id with `prefix`.
 *
 * @example
 * id: { type: new PublicIdType("ord"), primary: true },
 */
export class PublicIdType extends Type<IdValue, IdValue> {
  /** The model's prefix (`ord`). */
  readonly prefix: string;

  constructor(prefix: string) {
    super();
    this.prefix = prefix;
  }

  /**
   * A public id to the stored UUID.
   *
   * @throws TypeError for a string that is neither a public id nor a UUID.
   */
  override convertToDatabaseValue(value: IdValue): IdValue {
    if (typeof value !== "string" || STORED.test(value)) return value;
    return publicIdToUuid(value);
  }

  /** A stored UUID to the public id with this type's prefix. */
  override convertToJSValue(value: IdValue): IdValue {
    return typeof value === "string" && STORED.test(value)
      ? uuidToPublicId(this.prefix, value)
      : value;
  }

  /** Ids compare as strings. */
  override compareAsType(): string {
    return "string";
  }

  /** `uuid`: 16 bytes, half a `varchar(33)` key. */
  override getColumnType(): string {
    return "uuid";
  }
}
