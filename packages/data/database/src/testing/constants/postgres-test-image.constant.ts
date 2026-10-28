/**
 * Stackra file contract:
 * Purpose: `POSTGRES_TEST_IMAGE`, the integration-tier Postgres image: the image tag `usePostgres()` runs by default and
 *          the Dockerfile it is built from, so every approved extension (ADR 0160, PostGIS by ADR 0314) can be created
 *          in an `.int` test, as production allows.
 * Boundary: internal to `./testing`; data only, built by `buildPostgresTestImage`. The base is the PostGIS image of
 *           the current Postgres major (Debian, with the PGDG apt repository the official image configures), plus
 *           the PGDG pgvector package; ltree, pg_trgm, citext and pgcrypto ship with Postgres itself. The tag names
 *           the versions, so a change of base gives a new tag and never reuses a stale local build.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 2: the approved extensions); ADR 0314 (decision 1: PostGIS); ADR 0182 (the
 *                     integration tier); ADR 0269 (decision 3); gap db19 (stackra-284).
 */

/** The Postgres image of the integration tier. */
export const POSTGRES_TEST_IMAGE: {
  /** The local tag the image is built under. */
  readonly tag: string;
  /** The Dockerfile it is built from. */
  readonly dockerfile: string;
} = Object.freeze({
  tag: "stackra-postgres-test:18-postgis3.6-pgvector",
  dockerfile: [
    "FROM postgis/postgis:18-3.6",
    "RUN apt-get update \\",
    " && apt-get install -y --no-install-recommends postgresql-18-pgvector \\",
    " && rm -rf /var/lib/apt/lists/*",
    "",
  ].join("\n"),
});
