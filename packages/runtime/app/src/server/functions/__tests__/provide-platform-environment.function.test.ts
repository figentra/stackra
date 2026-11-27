/**
 * Stackra file contract:
 * Purpose: unit tests of `providePlatformEnvironment`: a deployed platform with no variable settles
 *          `STACKRA_ENVIRONMENT` to its deployed environment and records the platform; a developer machine keeps the
 *          declared value; a deployed platform named `dev` and a self-hosted image without metadata fail and record
 *          nothing (STA-2844).
 * Boundary: test only; passes its own environment object, never `process.env`, and resets the recorded platform.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0296 (amendment 2026-11-26); STA-2844.
 */
import { ConfigInvalidError } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { PLATFORM_ENVIRONMENT_HOST } from "#server/constants/platform-environment-host.constant";
import { providePlatformEnvironment } from "#server/functions/provide-platform-environment.function";

describe("providePlatformEnvironment", () => {
  afterEach(() => {
    PLATFORM_ENVIRONMENT_HOST.current = undefined;
  });

  it("settles a deployed platform's environment where nothing set the variable", () => {
    const env: Record<string, string | undefined> = {};
    const platform = { name: "acme-prod", type: "production", cloud: "aws", extra: 1 };
    expect(providePlatformEnvironment(platform, env)).toBe("production");
    expect(env["STACKRA_ENVIRONMENT"]).toBe("production");
    expect(PLATFORM_ENVIRONMENT_HOST.current).toEqual({
      name: "acme-prod",
      type: "production",
      cloud: "aws",
    });
  });

  it("keeps a developer machine's declared value and settles unset as dev", () => {
    const declared: Record<string, string | undefined> = { STACKRA_ENVIRONMENT: "staging" };
    const machine = { name: "local", type: "development", cloud: "local" };
    expect(providePlatformEnvironment(machine, declared)).toBe("staging");
    const unset: Record<string, string | undefined> = {};
    expect(providePlatformEnvironment(machine, unset)).toBe("dev");
    expect(unset["STACKRA_ENVIRONMENT"]).toBe("dev");
  });

  it("refuses dev on a deployed platform and a bare self-hosted image, recording nothing", () => {
    const dev: Record<string, string | undefined> = { STACKRA_ENVIRONMENT: "dev" };
    expect(() =>
      providePlatformEnvironment({ name: "acme-prod", type: "production", cloud: "aws" }, dev),
    ).toThrow(ConfigInvalidError);
    expect(dev["STACKRA_ENVIRONMENT"]).toBe("dev");
    const bare: Record<string, string | undefined> = {};
    expect(() =>
      providePlatformEnvironment({ name: "", type: "development", cloud: "local" }, bare),
    ).toThrow(/is not set/);
    expect(bare["STACKRA_ENVIRONMENT"]).toBeUndefined();
    expect(PLATFORM_ENVIRONMENT_HOST.current).toBeUndefined();
  });
});
