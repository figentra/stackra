/**
 * Stackra file contract:
 * Purpose: `Extension`, the Postgres extensions a migration may create with `schema.createExtension(...)`: exactly
 *          the five ADR 0160 approves, by their SQL names.
 * Boundary: an `Enum.of` value plus the type of the same name. Adding an extension (PostGIS included) needs an ADR
 *           first; the migration compiler refuses any other name at run time too.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (decision 2: the approved extensions); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/** The approved extensions. */
export const Extension = Enum.of({
  /** pgvector: embeddings and nearest-neighbour search. */
  Vector: "vector",
  /** Trigram similarity and the trigram index operator classes. */
  Trigram: "pg_trgm",
  /** Label trees: hierarchies such as categories and scope paths. */
  Ltree: "ltree",
  /** Case-insensitive text. */
  Citext: "citext",
  /** Hashing and encryption functions. */
  Pgcrypto: "pgcrypto",
});

/** One of the codes above. */
export type Extension = Enum.Value<typeof Extension>;
