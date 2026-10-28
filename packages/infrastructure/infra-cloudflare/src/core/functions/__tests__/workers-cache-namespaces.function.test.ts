/**
 * Stackra file contract:
 * Purpose: unit tests of `workersCacheNamespaces`: an environment whose default cache driver is `workers` gets a
 *          namespace titled `<project>-<environment>-cache`; one on another driver, or naming none, gets none.
 * Boundary: test only; roots are built through `parseRunway`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decisions 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { rootRunway } from "#core/__tests__/fixtures/root-runway.fixture";
import { workersCacheNamespaces } from "#core/functions/workers-cache-namespaces.function";

describe("workersCacheNamespaces", () => {
  it("gives a namespace to each environment on the workers cache driver only", () => {
    const root = rootRunway({
      environments: {
        dev: {},
        staging: { defaults: { service: { config: { cache: { driver: "valkey" } } } } },
        production: {
          defaults: { service: { config: { cache: { driver: "workers", lock: true } } } },
        },
      },
    });

    expect(workersCacheNamespaces(root)).toEqual({ production: "figentra-production-cache" });
  });

  it("gives none when no environment names a cache driver", () => {
    expect(workersCacheNamespaces(rootRunway())).toEqual({});
  });
});
