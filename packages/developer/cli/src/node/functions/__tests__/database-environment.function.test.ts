/**
 * Stackra file contract:
 * Purpose: unit tests of `databaseEnvironment`: `--env` wins, then `STACKRA_ENVIRONMENT`, then `dev`; an unknown name
 *          is a usage error.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 2 as amended).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { databaseEnvironment } from "#node/functions/database-environment.function";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("databaseEnvironment", () => {
  it("takes --env first, then STACKRA_ENVIRONMENT, then dev", () => {
    vi.stubEnv("STACKRA_ENVIRONMENT", "staging");
    expect(databaseEnvironment({ env: "preview" })).toBe("preview");
    expect(databaseEnvironment({})).toBe("staging");
    vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
    expect(databaseEnvironment({})).toBe("dev");
  });

  it("refuses an unknown environment", () => {
    expect(() => databaseEnvironment({ env: "qa" })).toThrow(CliUsageError);
  });
});
