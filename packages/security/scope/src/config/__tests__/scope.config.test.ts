/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ScopeConfig` and its shipped `ScopeConfig$`: the key `scope`, the defaults
 *          (platform then product, root `platform`, no alias), a deployment override that adds a level and an alias as
 *          data with no code change, a runway values layer, the refusals (no level, a repeated or malformed level key,
 *          a root that is not one label, an alias that is not a lang key), and the generated host schema's
 *          `ScopeConfig$.extend(...)` form.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 2 and 4); ADR 0294 (decisions 19 and 20).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ScopeConfig, ScopeConfig as BaseScopeConfig } from "#config/scope.config";
import type { ScopeLevel } from "#contracts/index";
import { ScopeConfig$ } from "#core/constants/scope-config-schema.constant";

/** A deployment that nests stores to any depth under a product and shows products as brands. */
class StoreScopeConfig extends BaseScopeConfig {
  override levels: ScopeLevel[] = [
    { key: "platform", recursive: false },
    { key: "product", recursive: false },
    { key: "store", recursive: true },
  ];

  override aliases = { product: "app::scope.brand" };
}

describe("ScopeConfig", () => {
  it("is a configuration keyed scope, an override inheriting the key", () => {
    expect(new ScopeConfig()).toBeInstanceOf(Config);
    expect(configKey(ScopeConfig, "scope")).toBe("scope");
    expect(configKey(StoreScopeConfig, "scope")).toBe("scope");
  });

  it("defaults to platform then product, rooted at platform, with no alias", () => {
    const config = buildConfig(ScopeConfig);
    expect({ ...config }).toEqual(ScopeConfig$.parse({}));
    expect(config.levels).toEqual([
      { key: "platform", recursive: false },
      { key: "product", recursive: false },
    ]);
    expect(config.root).toBe("platform");
    expect(config.aliases).toEqual({});
    expectTypeOf(config.levels).toExtend<readonly ScopeLevel[]>();
  });

  it("takes a level and an alias as data", () => {
    const config = buildConfig(StoreScopeConfig);
    expect(config.levels.map((level) => level.key)).toEqual(["platform", "product", "store"]);
    expect(config.levels[2]?.recursive).toBe(true);
    expect(config.aliases).toEqual({ product: "app::scope.brand" });
  });

  it("takes a runway values layer", () => {
    const config = buildConfig(ScopeConfig, { values: { root: "global" } });
    expect(config.root).toBe("global");
  });

  it("refuses levels, a root and an alias that break the rules", () => {
    for (const values of [
      { levels: [] },
      {
        levels: [
          { key: "platform", recursive: false },
          { key: "platform", recursive: true },
        ],
      },
      { levels: [{ key: "Platform", recursive: false }] },
      { root: "platform.acme" },
      { aliases: { product: "Brand" } },
    ])
      expect(() => buildConfig(ScopeConfig, { values: values as never })).toThrow(
        ConfigInvalidError,
      );
  });

  it("is extended by a host's generated schema", () => {
    const Host$ = ScopeConfig$.extend({
      levels: ScopeConfig$.shape.levels.unwrap().default(() => [
        { key: "platform", recursive: false },
        { key: "product", recursive: false },
        { key: "store", recursive: true },
      ]),
      aliases: ScopeConfig$.shape.aliases.unwrap().default(() => ({ product: "app::scope.brand" })),
    });
    expect(Host$.parse({})).toEqual({ ...buildConfig(StoreScopeConfig) });
  });
});
