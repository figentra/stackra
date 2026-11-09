/**
 * Stackra file contract:
 * Purpose: `requireTestPeer(name)`, loads one of the test-only packages (Faker, PGlite, its extensions, the
 *          MikroORM PGlite driver, Testcontainers) on first use, and says how to install them when one is missing.
 * Boundary: internal to `./testing`. It loads synchronously with `createRequire`, not `await import`, because its two
 *           callers are synchronous: a factory's `make` reads Faker, and `MemoryDatabaseDriver.em()` reads the ORM
 *           right after `new`. An async load would make both async or force every caller to await a preload first. The
 *           packages are not peers (they forked every dependent's install): a member that uses them installs them as
 *           devDependencies and `testPeerRequire` finds them there, so a service without them still imports
 *           `./testing`; only a test that really needs one fails. shortcut: `require` of an ES module needs Node 22.12 or later
 *           and a module without top-level await; move to an awaited preload if a peer adds one.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: only the testing entry loads them); STA-1812.
 */
import { testPeerRequire } from "#testing/functions/test-peer-require.function";

/** The test-only packages, named in the error. */
const PEERS = [
  "@faker-js/faker",
  "@electric-sql/pglite",
  "@electric-sql/pglite-pgvector",
  "@mikro-orm/pglite",
  "testcontainers",
  "@testcontainers/postgresql",
] as const;

/**
 * Loads `name` the first time a test needs it.
 *
 * @throws Error naming the four optional test peers when `name` is not installed.
 */
export function requireTestPeer<T>(name: string): T {
  try {
    return testPeerRequire<T>(name);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== "MODULE_NOT_FOUND" && code !== "ERR_MODULE_NOT_FOUND") throw error;
    throw new Error(
      `@stackra/database/testing needs "${name}", which is not installed. Its test-only packages are ` +
        `${PEERS.join(", ")}: add them as devDependencies of this member with their \`catalog:\` entries.`,
      { cause: error },
    );
  }
}
