/**
 * Stackra file contract:
 * Purpose: unit tests of `devPortsOf`: each member runway's `environments.dev.port`, members without one left out.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0290 (decision 4), ADR 0296 (decision 1).
 */
import { parseRunway } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { devPortsOf } from "#core/functions/dev-ports-of.function";

describe("devPortsOf", () => {
  it("reads each member's dev port", () => {
    const runways = {
      console: parseRunway("app", { version: 3, environments: { dev: { port: 5173 } } }),
      docs: parseRunway("app", { version: 3, environments: { production: {} } }),
      commerce: parseRunway("service", { version: 3, environments: { dev: { port: 4001 } } }),
    };

    expect(devPortsOf(runways)).toEqual({ console: 5173, commerce: 4001 });
  });
});
