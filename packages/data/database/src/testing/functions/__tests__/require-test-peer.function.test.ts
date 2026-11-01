/**
 * Stackra file contract:
 * Purpose: unit tests of `requireTestPeer`: it loads an installed package and, for a missing one, throws an Error that
 *          names all four optional test peers and says to add them as catalog devDependencies.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0269 (decision 3); ADR 0022; STA-1812.
 */
import { describe, expect, it } from "@stackra/testing";

import { requireTestPeer } from "#testing/functions/require-test-peer.function";

/** Asks for a package that is not installed. */
const attempt = (): unknown => requireTestPeer("@stackra/not-installed-peer");

describe("requireTestPeer", () => {
  it("loads an installed package", () => {
    expect(typeof requireTestPeer<{ join: unknown }>("node:path").join).toBe("function");
  });

  it("names all four peers and the catalog when a package is missing", () => {
    expect(attempt).toThrow(Error);
    for (const peer of [
      "@faker-js/faker",
      "@electric-sql/pglite",
      "@electric-sql/pglite-pgvector",
      "@mikro-orm/pglite",
      "devDependencies",
      "catalog:",
    ])
      expect(attempt).toThrow(peer);
  });
});
