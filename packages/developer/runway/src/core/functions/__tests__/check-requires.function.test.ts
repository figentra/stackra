/**
 * Stackra file contract:
 * Purpose: unit tests of `checkRequires` (STA-2049): a `valkey` requirement passes when the member's or the root's
 *          cache driver is `valkey` in some environment, and is reported at `requires.<name>` when no environment's
 *          driver serves it; other engines are not resolved to a driver.
 * Boundary: test only; runways are built through `parseRunway`, so each is a checked shape.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 5 and enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkRequires } from "#core/functions/check-requires.function";
import { parseRunway } from "#core/functions/parse-runway.function";

/** A root runway whose staging services default to the cache driver `driver`. */
const rootWith = (driver: string) =>
  parseRunway("root", {
    version: 3,
    project: "acme-platform",
    environments: {
      staging: { defaults: { service: { config: { cache: { driver } } } } },
    },
  });

/** A service runway that requires a dedicated valkey cache and a postgres search, with `environments`. */
const commerceWith = (environments: Record<string, unknown> = {}) =>
  parseRunway("service", {
    version: 3,
    requires: {
      cache: { engine: "valkey", dedicated: true, reason: "carts need their own eviction" },
      search: { engine: "postgres" },
    },
    environments,
  });

describe("checkRequires", () => {
  it("passes a valkey requirement the root's default cache driver serves", () => {
    expect(checkRequires(rootWith("valkey"), commerceWith())).toEqual([]);
  });

  it("passes a valkey requirement the member's own cache driver serves", () => {
    expect(
      checkRequires(
        rootWith("memory"),
        commerceWith({ production: { config: { cache: { driver: "valkey" } } } }),
      ),
    ).toEqual([]);
  });

  it("reports a valkey requirement no environment's driver serves, at its requires path", () => {
    expect(
      checkRequires(
        rootWith("valkey"),
        commerceWith({ staging: { config: { cache: { driver: "memory" } } } }),
      ),
    ).toEqual([
      {
        path: "requires.cache",
        message: expect.stringMatching(/^No driver serves this valkey requirement/),
      },
    ]);
  });
});
