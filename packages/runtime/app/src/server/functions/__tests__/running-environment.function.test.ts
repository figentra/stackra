/**
 * Stackra file contract:
 * Purpose: unit tests of `runningEnvironment`: it answers what the one reader answers for `process.env` and the
 *          platform `providePlatformEnvironment` recorded: `dev` with neither, the variable with no platform, the
 *          deployed environment of a platform that set no variable, and a refusal for `dev` on a deployed platform and
 *          for a misspelt name.
 * Boundary: test only; the process's `STACKRA_ENVIRONMENT` is stubbed and the recorded platform reset after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0296 (amendment 2026-11-26); STA-2844; STA-2795.
 */
import { ConfigInvalidError, StackraEnvironment } from "@stackra/config";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PLATFORM_ENVIRONMENT_HOST } from "#server/constants/platform-environment-host.constant";
import { runningEnvironment } from "#server/functions/running-environment.function";

describe(runningEnvironment, () => {
  beforeEach(() => {
    vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    PLATFORM_ENVIRONMENT_HOST.current = undefined;
  });

  it("is dev with no variable and no platform, else the variable", () => {
    expect(runningEnvironment()).toBe(StackraEnvironment.Dev);
    vi.stubEnv("STACKRA_ENVIRONMENT", "staging");
    expect(runningEnvironment()).toBe(StackraEnvironment.Staging);
  });

  it("is the deployed environment of a platform that set no variable", () => {
    PLATFORM_ENVIRONMENT_HOST.current = { name: "acme-prod", type: "production", cloud: "aws" };
    expect(runningEnvironment()).toBe(StackraEnvironment.Production);
  });

  it("refuses dev on a deployed platform and a misspelt name", () => {
    PLATFORM_ENVIRONMENT_HOST.current = { name: "acme-prod", type: "production", cloud: "aws" };
    vi.stubEnv("STACKRA_ENVIRONMENT", "dev");
    expect(() => runningEnvironment()).toThrow(ConfigInvalidError);
    PLATFORM_ENVIRONMENT_HOST.current = undefined;
    vi.stubEnv("STACKRA_ENVIRONMENT", "DEV");
    expect(() => runningEnvironment()).toThrow(ConfigInvalidError);
  });
});
