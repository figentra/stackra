/**
 * Stackra file contract:
 * Purpose: unit tests of `AppIconConfig`: keyed `platform.app_icon`, no alternate icons by default, a host's icon set,
 *          and refusing a name the native project cannot key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0250 (decision 2); ADR 0294 (decisions 19 and 20).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { AppIconConfig as BaseAppIconConfig } from "#config/app-icon.config";

/** A host's override: a brand's seasonal icons. */
class AppIconConfig extends BaseAppIconConfig {
  override icons = ["Ramadan", "Winter"];
}

describe("AppIconConfig", () => {
  it("is keyed platform.app_icon", () => {
    expect(configKey(BaseAppIconConfig, "platform")).toBe("platform.app_icon");
  });

  it("carries no alternate icons by default and takes a host's set", () => {
    expect(buildConfig(BaseAppIconConfig).icons).toEqual([]);
    expect(buildConfig(AppIconConfig).icons).toEqual(["Ramadan", "Winter"]);
  });

  it("refuses a name that is not PascalCase", () => {
    class BadAppIconConfig extends BaseAppIconConfig {
      override icons = ["ramadan-2027"];
    }
    expect(() => buildConfig(BadAppIconConfig)).toThrow(ConfigInvalidError);
  });
});
