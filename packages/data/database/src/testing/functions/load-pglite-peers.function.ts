/**
 * Stackra file contract:
 * Purpose: `loadPglitePeers`, loads PGlite, its approved extensions and the MikroORM PGlite driver together on first
 *          use and keeps them, so no test-only peer is loaded on import (STA-1812).
 * Boundary: internal to `./testing`; loads through `requireTestPeer`. The extensions are all of ADR 0160's, plus
 *           PostGIS (ADR 0314) when the member installs `@electric-sql/pglite-postgis` (a member with geography columns
 *           does; the bundle is large, so the others need not).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685; STA-1812.
 */
import type { Extension, Extensions, PGlite } from "@electric-sql/pglite";
import type { vector } from "@electric-sql/pglite-pgvector";
import type * as PgliteOrm from "@mikro-orm/pglite";

import { optionalTestPeer } from "#testing/functions/optional-test-peer.function";
import { requireTestPeer } from "#testing/functions/require-test-peer.function";

/** What the testing driver needs from the optional peers. */
interface PglitePeers {
  readonly orm: typeof PgliteOrm;
  readonly PGlite: typeof PGlite;
  readonly extensions: Extensions;
}

let peers: PglitePeers | undefined;

/** PostGIS when its PGlite bundle is installed, else nothing. */
const postgisExtension = (): Extensions => {
  const postgis = optionalTestPeer<{ postgis: Extension }>("@electric-sql/pglite-postgis")?.postgis;
  return postgis === undefined ? {} : { postgis };
};

/** Loads the peers on first call and returns the same objects afterwards. */
export function loadPglitePeers(): PglitePeers {
  peers ??= {
    orm: requireTestPeer<typeof PgliteOrm>("@mikro-orm/pglite"),
    PGlite: requireTestPeer<{ PGlite: typeof PGlite }>("@electric-sql/pglite").PGlite,
    extensions: {
      vector: requireTestPeer<{ vector: typeof vector }>("@electric-sql/pglite-pgvector").vector,
      ltree: requireTestPeer<{ ltree: Extension }>("@electric-sql/pglite/contrib/ltree").ltree,
      pg_trgm: requireTestPeer<{ pg_trgm: Extension }>("@electric-sql/pglite/contrib/pg_trgm")
        .pg_trgm,
      citext: requireTestPeer<{ citext: Extension }>("@electric-sql/pglite/contrib/citext").citext,
      pgcrypto: requireTestPeer<{ pgcrypto: Extension }>("@electric-sql/pglite/contrib/pgcrypto")
        .pgcrypto,
      ...postgisExtension(),
    },
  };
  return peers;
}
