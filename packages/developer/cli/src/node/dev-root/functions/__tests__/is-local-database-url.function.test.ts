/**
 * Stackra file contract:
 * Purpose: unit tests of `isLocalDatabaseUrl`: loopback hosts, Unix sockets and no host are local; any other host (in
 *          the authority or the `host` parameter) and an unparsable string are not.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2840.
 */
import { describe, expect, it } from "@stackra/testing";

import { isLocalDatabaseUrl } from "#node/dev-root/functions/is-local-database-url.function";

describe("isLocalDatabaseUrl", () => {
  it("answers true for loopback hosts, Unix sockets and no host", () => {
    for (const url of [
      "postgresql://u:p@localhost:5432/billing",
      "postgresql://u@127.0.0.1:9500/billing?sslmode=disable",
      "postgres://u@127.12.0.3/billing",
      "postgresql://u@[::1]:5432/billing",
      "postgresql://u@db.localhost/billing",
      "postgresql:///billing?host=/var/run/postgresql",
      "postgresql:///billing?host=localhost",
      "postgresql:///billing",
    ])
      expect(isLocalDatabaseUrl(url), url).toBe(true);
  });

  it("answers false for any other host or a string that is not a URL", () => {
    for (const url of [
      "postgresql://u:p@db.example.com:5432/billing",
      "postgresql://u@10.0.0.5/billing",
      "postgresql://u@[2001:db8::1]/billing",
      "postgresql://u@localhost.example.com/billing",
      "postgresql://u@128.0.0.1/billing",
      "postgresql:///billing?host=db.example.com",
      "not a url",
    ])
      expect(isLocalDatabaseUrl(url), url).toBe(false);
  });
});
