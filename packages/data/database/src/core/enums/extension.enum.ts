/**
 * Stackra file contract:
 * Purpose: `Extension`, the Postgres extensions a migration may create with `schema.createExtension(...)`: exactly
 *          the five ADR 0160 approves plus PostGIS (ADR 0314) and pg_stat_statements (ADR 0160 note, stackra-282), by
 *          their SQL names.
 * Boundary: an `Enum.of` value plus the type of the same name. Adding another extension needs an ADR (or an ADR 0160
 *           amendment) first; the migration compiler refuses any other name at run time too.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (decision 2: the approved extensions); ADR 0314 (decision 1: PostGIS); ADR 0160 2026-10-29 note
 *                     (pg_stat_statements); ADR 0294 (decision 16: Enum).
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
  /** PostGIS: geometry and geography types and their GiST indexes (ADR 0314). */
  Postgis: "postgis",
  /** Statement statistics: normalised statements with their call counts and times (ADR 0160 note of 2026-10-29). */
  PgStatStatements: "pg_stat_statements",
});

/** One of the codes above. */
export type Extension = Enum.Value<typeof Extension>;
