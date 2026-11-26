/**
 * Stackra file contract:
 * Purpose: unit tests of the server `createApp`'s running environment (STA-2844): a configuration mapped to
 *          `STACKRA_ENVIRONMENT` sees what the one reader answers, the deployed environment of a platform that set no
 *          variable (Encore Cloud cannot), `dev` with no platform and no variable, and boot fails on `dev` declared on a
 *          deployed platform, on a misspelt name and on a self-hosted image that reports nothing.
 * Boundary: test only; boots real containers; the process's `STACKRA_ENVIRONMENT` is stubbed and the recorded platform
 *           reset after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 8); ADR 0296 (amendment 2026-11-26); STA-2844.
 */
import { Config, ConfigInvalidError } from "@stackra/config";
import { Module } from "@stackra/container";
import type { Wiring } from "@stackra/container";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { vi } from "vitest";
import { z } from "zod";

import { PLATFORM_ENVIRONMENT_HOST } from "#server/constants/platform-environment-host.constant";
import { createApp } from "#server/functions/create-app.function";

class SiteOptions extends Schema {
  environment = "";
}

registerSchemas([[SiteOptions, z.object({ environment: z.string() })]]);

/** A configuration that reads the running environment, as the audit, store and bearer configurations do. */
class SiteConfig extends Config({
  schema: SiteOptions,
  env: { environment: "STACKRA_ENVIRONMENT" },
}) {}

class SiteModule extends Module({}) {}

const wiring: Wiring = {
  member: "site",
  root: SiteModule,
  modules: { site: { exports: [], dependsOn: [], type: SiteModule } },
  bindings: [],
  config: [{ key: "site", provide: SiteConfig }],
};

/** Boots the app and answers the environment its configuration read. */
async function bootedEnvironment(): Promise<string> {
  const app = await createApp(SiteModule, { wiring });
  try {
    return await app.handlers.run(async (container) => container.get(SiteConfig).environment);
  } finally {
    await app.close();
  }
}

describe("createApp (server) running environment", () => {
  beforeEach(() => {
    vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    PLATFORM_ENVIRONMENT_HOST.current = undefined;
  });

  it("boots a deployed platform that set no variable as its deployed environment, never dev", async () => {
    PLATFORM_ENVIRONMENT_HOST.current = { name: "acme-prod", type: "production", cloud: "aws" };
    expect(await bootedEnvironment()).toBe("production");
    PLATFORM_ENVIRONMENT_HOST.current = { name: "qa", type: "development", cloud: "encore" };
    expect(await bootedEnvironment()).toBe("staging");
  });

  it("boots dev with no platform and no variable, and the declared value otherwise", async () => {
    expect(await bootedEnvironment()).toBe("dev");
    vi.stubEnv("STACKRA_ENVIRONMENT", "preview");
    expect(await bootedEnvironment()).toBe("preview");
  });

  it("fails boot on dev declared on a deployed platform", async () => {
    PLATFORM_ENVIRONMENT_HOST.current = { name: "acme-prod", type: "production", cloud: "aws" };
    vi.stubEnv("STACKRA_ENVIRONMENT", "dev");
    await expect(createApp(SiteModule, { wiring })).rejects.toThrow(ConfigInvalidError);
  });

  it("fails boot on a misspelt environment and on a self-hosted image that reports nothing", async () => {
    vi.stubEnv("STACKRA_ENVIRONMENT", "prod");
    await expect(createApp(SiteModule, { wiring })).rejects.toThrow(/is not a Stackra environment/);
    vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
    PLATFORM_ENVIRONMENT_HOST.current = { name: "", type: "development", cloud: "local" };
    await expect(createApp(SiteModule, { wiring })).rejects.toThrow(/is not set/);
  });
});
