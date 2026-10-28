/**
 * Stackra file contract:
 * Purpose: unit tests of `PLATFORM_BINDINGS`: each platform service gen binds is keyed `<package>#<Class>` and lists
 *          its constructor tokens in parameter order (`RequestContext`, `IntegrationRuntime`, `Locks`,
 *          `WebhookReceiver`, `SequenceService`, the settings reader and resolver, and `RuleSetService`, whose one
 *          token is the per-model `repositoryOf(Revision)`, and `MediaLibrary` over the `FileSystem` disk, its config
 *          and the clock, STA-1297, ADR 0465); the map is frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0263; ADR 0136; ADR 0308; ADR 0224; ADR 0331.
 */
import { describe, expect, it } from "@stackra/testing";

import { PLATFORM_BINDINGS } from "#core/constants/platform-bindings.constant";
import type { ClassRef } from "#core/types/class-ref.type";
import type { TokenRef } from "#core/types/token-ref.type";

/** The class name a token names. */
const nameOf = (token: ClassRef | TokenRef): string =>
  "class" in token ? token.class.name : token.name;

describe("PLATFORM_BINDINGS", () => {
  it("lists each platform service's constructor tokens in order", () => {
    expect(Object.keys(PLATFORM_BINDINGS).sort()).toEqual([
      "@stackra/actions#RequestContext",
      "@stackra/ai#AgentRuntime",
      "@stackra/database#SequenceService",
      "@stackra/integrations#IntegrationRuntime",
      "@stackra/locking#Locks",
      "@stackra/media#MediaLibrary",
      "@stackra/rules#RuleSetService",
      "@stackra/settings#SettingsReader",
      "@stackra/settings#SettingsResolver",
      "@stackra/webhooks#WebhookReceiver",
    ]);
    expect(PLATFORM_BINDINGS["@stackra/locking#Locks"]?.map(nameOf)).toEqual([
      "LockDriver",
      "Clock",
    ]);
    expect(PLATFORM_BINDINGS["@stackra/webhooks#WebhookReceiver"]?.map(nameOf)).toEqual([
      "ConnectionStore",
      "SecretStore",
      "EventOutbox",
      "Clock",
    ]);
    expect(PLATFORM_BINDINGS["@stackra/media#MediaLibrary"]?.map(nameOf)).toEqual([
      "FileSystem",
      "MediaConfig",
      "Clock",
    ]);
    expect(PLATFORM_BINDINGS["@stackra/rules#RuleSetService"]).toEqual([
      {
        class: { name: "Revision", from: "@stackra/content/node" },
        of: { name: "repositoryOf", from: "@stackra/database" },
      },
    ]);
    expect(Object.isFrozen(PLATFORM_BINDINGS)).toBe(true);
  });
});
