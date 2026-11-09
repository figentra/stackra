/**
 * Stackra file contract:
 * Purpose: `PostgresExtension`, the approved Postgres extensions a service runway's
 *          `environments.<env>.database.extensions` may name, by their SQL names: the five of ADR 0160 decision 2,
 *          PostGIS (ADR 0314), and pg_stat_statements and btree_gist (ADR 0160 notes of 2026-10-29 and 2026-11-03).
 * Boundary: an `Enum.of` value plus the type of the same name. This is the one approved list (ADR 0160 note of
 *           2026-11-03): infra pre-creates and preloads from it, and gen's manifest `RequiredExtensions` must be a
 *           subset. Adding a name needs an ADR 0160 amendment first, and the canonical service schema's `enum` with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (decision 2 and its notes), ADR 0314 (decision 1), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** The approved extensions. */
export const PostgresExtension = Enum.of({
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
  /** PostGIS: geometry and geography types (ADR 0314). */
  Postgis: "postgis",
  /** Statement statistics; the server must preload it (ADR 0160 note of 2026-10-29). */
  PgStatStatements: "pg_stat_statements",
  /** B-tree operator classes for GiST: exclusion constraints over ranges plus equality (ADR 0160 note of 2026-11-03). */
  BtreeGist: "btree_gist",
});

/** One of the codes above. */
export type PostgresExtension = Enum.Value<typeof PostgresExtension>;
