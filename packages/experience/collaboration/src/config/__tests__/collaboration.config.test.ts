/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CollaborationConfig`: a configuration over `CollaborationOptions` keyed
 *          `collaboration`, built with its defaults, an override, a runway values layer, and refused values.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CollaborationConfig } from "#config/collaboration.config";
import { COLLABORATION_CONFIG_SCHEMA } from "#core/constants/collaboration-config-schema.constant";

const BaseCollaborationConfig = CollaborationConfig;

/** A host's override. */
class StudioCollaborationConfig extends BaseCollaborationConfig {
  override snapshotIntervalSeconds = 10;
}

describe("CollaborationConfig", () => {
  it("is a configuration keyed collaboration, an override inheriting the key", () => {
    expect(new CollaborationConfig()).toBeInstanceOf(Config);
    expect(configKey(CollaborationConfig, "collaboration")).toBe("collaboration");
    expect(configKey(StudioCollaborationConfig, "collaboration")).toBe("collaboration");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(CollaborationConfig);
    expectTypeOf(config.cursorIntervalMilliseconds).toEqualTypeOf<number>();
    expect({ ...config }).toEqual(COLLABORATION_CONFIG_SCHEMA.parse({}));
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("applies an override and a runway values layer", () => {
    expect(buildConfig(StudioCollaborationConfig).snapshotIntervalSeconds).toBe(10);
    const config = buildConfig(StudioCollaborationConfig, {
      values: { cursorIntervalMilliseconds: 100 },
    });
    expect(config.cursorIntervalMilliseconds).toBe(100);
    expect(config.snapshotIntervalSeconds).toBe(10);
  });

  it("refuses a cursor interval under 16 ms", () => {
    expect(() =>
      buildConfig(CollaborationConfig, { values: { cursorIntervalMilliseconds: 5 } }),
    ).toThrow(ConfigInvalidError);
  });
});
