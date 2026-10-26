/**
 * Stackra file contract:
 * Purpose: unit tests of entitlement-gated settings through `SettingsReader` and `SettingsResolver`: a stored value
 *          the plan does not unlock reads as the default (typed `get`, page `read`, and `resolve` with provenance
 *          `entitlement`); a gated write is refused with `entitlement_required` and writes nothing; a grant unlocks
 *          both; no entitlement source bound fails closed; a system author records a seed write.
 * Boundary: test only; memory drivers and a fixed clock, the schema registered by hand as gen's schemas file does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0420 (decisions 1 to 3); ADR 0419 (decision 1).
 */
import type { Clock, ScopeRef } from "@stackra/contracts";
import { EntitlementRequiredError } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { SettingEnvironment, SettingSource } from "#contracts/index";
import { Settings } from "#core/bases/settings.base";
import { MemorySettingEntitlementSourceDriver } from "#core/drivers/memory-setting-entitlement-source.driver";
import { MemorySettingFloorSourceDriver } from "#core/drivers/memory-setting-floor-source.driver";
import { MemorySettingRevisionStoreDriver } from "#core/drivers/memory-setting-revision-store.driver";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingScope } from "#core/enums/setting-scope.enum";
import { SettingType } from "#core/enums/setting-type.enum";
import { settingKeys } from "#core/functions/setting-keys.function";
import { settingSystemAuthor } from "#core/functions/setting-system-author.function";
import { settingsPage } from "#core/functions/settings-page.function";
import { SettingsReader } from "#core/services/settings-reader.service";
import { SettingsResolver } from "#core/services/settings-resolver.service";

class GatedAccessSettings extends Settings({ scopes: [SettingScope.Platform, SettingScope.Node] }) {
  ssoEnforced = false;

  supportLength = "hour";
}

registerSchemas([
  [
    GatedAccessSettings,
    z.object({
      ssoEnforced: z.boolean().default(false),
      supportLength: z.string().default("hour"),
    }),
  ],
]);

const label = (key: string) => `gated_access::settings.${key}.label` as I18nKey;
const CASCADE = [SettingScope.Platform, SettingScope.Node];
settingKeys({
  gated_access: {
    ssoEnforced: {
      type: SettingType.Boolean,
      default: false,
      scopes: CASCADE,
      label: label("sso_enforced"),
      live: true,
      entitlement: "access.sso",
    },
    supportLength: {
      type: SettingType.String,
      default: "hour",
      scopes: CASCADE,
      label: label("support_length"),
      live: true,
      entitlementValues: { unlimited: "access.enterprise_support" },
    },
  },
});
const PAGE = settingsPage("gated_access", { scope: SettingScope.Node });

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const LIVE = { environment: SettingEnvironment.Live, author: "usr_author" };

/** The reader and resolver over memory drivers, the stored values above every grant. */
async function setup(bind = true) {
  const values = new MemorySettingValueStoreDriver();
  await values.write(
    "gated_access",
    { scope: ACME },
    { ssoEnforced: true, supportLength: "unlimited" },
  );
  const entitlements = new MemorySettingEntitlementSourceDriver();
  const source = bind ? entitlements : undefined;
  const clock = { now: () => new Date("2026-10-26T10:00:00.000Z") } as unknown as Clock;
  const revisions = new MemorySettingRevisionStoreDriver();
  return {
    values,
    entitlements,
    revisions,
    reader: new SettingsReader(values, undefined, source),
    resolver: new SettingsResolver(
      values,
      new MemorySettingFloorSourceDriver(),
      revisions,
      clock,
      source,
    ),
  };
}

describe("entitlement-gated settings", () => {
  it("reads a value the plan does not unlock as the default", async () => {
    const { reader, resolver } = await setup();
    expect(await reader.get(GatedAccessSettings, { scope: ACME })).toMatchObject({
      ssoEnforced: false,
      supportLength: "hour",
    });
    expect((await reader.read(PAGE, { scope: ACME })).values).toEqual({
      ssoEnforced: false,
      supportLength: "hour",
    });
    const page = await resolver.resolve(PAGE, { scope: ACME });
    expect(page["ssoEnforced"]).toMatchObject({
      value: false,
      source: SettingSource.Entitlement,
      holder: null,
    });
    expect(page["supportLength"]).toMatchObject({
      value: "hour",
      source: SettingSource.Entitlement,
    });
  });

  it("reads the stored values once granted", async () => {
    const { entitlements, resolver } = await setup();
    entitlements.grant("access.sso", "access.enterprise_support");
    expect(await resolver.get(GatedAccessSettings, { scope: ACME })).toMatchObject({
      ssoEnforced: true,
      supportLength: "unlimited",
    });
    const page = await resolver.resolve(PAGE, { scope: ACME });
    expect(page["supportLength"]).toMatchObject({
      value: "unlimited",
      source: SettingSource.Layer,
    });
  });

  it("refuses a gated write and writes nothing, and lets an ungated value through", async () => {
    const { resolver, reader, revisions } = await setup();
    const refused = await resolver
      .write(PAGE, { supportLength: "unlimited" }, { scope: ACME }, LIVE)
      .catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(EntitlementRequiredError);
    expect((refused as EntitlementRequiredError).fieldErrors).toEqual({
      supportLength: "entitlement_required",
    });
    await expect(reader.write(PAGE, { ssoEnforced: true }, { scope: ACME })).rejects.toBeInstanceOf(
      EntitlementRequiredError,
    );
    await expect(revisions.list("gated_access", { scope: ACME })).resolves.toEqual([]);
    await expect(
      resolver.write(PAGE, { supportLength: "day" }, { scope: ACME }, LIVE),
    ).resolves.toMatchObject({ values: { supportLength: "day" } });
  });

  it("fails closed with no entitlement source bound", async () => {
    const { resolver } = await setup(false);
    expect(await resolver.get(GatedAccessSettings, { scope: ACME })).toMatchObject({
      ssoEnforced: false,
    });
    await expect(
      resolver.applyChange(
        "gated_access",
        { scope: ACME },
        { values: { ssoEnforced: true }, removed: [] },
        LIVE,
      ),
    ).rejects.toBeInstanceOf(EntitlementRequiredError);
  });

  it("records a seed write under a system author", async () => {
    const { resolver } = await setup();
    const revision = await resolver.applyChange(
      "gated_access",
      { scope: ACME },
      { values: { supportLength: "day" }, removed: [] },
      { environment: SettingEnvironment.Live, author: settingSystemAuthor("seed") },
    );
    expect(revision.author).toBe("sys_seed");
  });
});
