/**
 * Stackra file contract:
 * Purpose: unit tests of `BrandingSettings`: a group at the platform and the scope level tenancy contributes, keyed
 *          `branding`, every field unset by default; stored values read back, a low-contrast colour included (contrast
 *          is not a read rule); a malformed colour, a name over 80 characters and an id that is not an upload id read
 *          as unset, so a stored value never makes a read throw.
 * Boundary: test only; the store is settings' memory driver under the real `SettingsReader`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 22 to 24); ADR 0323 (decision 4); STA-2644.
 */
import { kindOf } from "@stackra/container";
import { MemorySettingValueStoreDriver, SettingScope, SettingsReader } from "@stackra/settings";
import { TenancyScopes } from "@stackra/tenancy";
import { describe, expect, it } from "@stackra/testing";

import { BrandingSettings } from "#core/branding.settings";

/** A reader over `values` stored at the root. */
const readerOf = (values: Readonly<Record<string, string | null>>) =>
  new SettingsReader(new MemorySettingValueStoreDriver().seed("branding", values));

/** The brand settings group. */
describe("BrandingSettings", () => {
  /** The scopes the console edits it at. */
  it("is a settings group at the platform and the scope level tenancy contributes", () => {
    expect(kindOf(BrandingSettings)?.options["scopes"]).toEqual([
      SettingScope.Platform,
      TenancyScopes.Tenant,
    ]);
  });

  /** Plain until a level sets something. */
  it("resolves every field unset by default", async () => {
    const settings = await readerOf({}).get(BrandingSettings);
    expect(settings).toBeInstanceOf(BrandingSettings);
    expect(settings.displayName).toEqual({ en: null, ar: null });
    expect([settings.logo, settings.mark]).toEqual([null, null]);
    expect([settings.primaryColor, settings.accentColor]).toEqual([null, null]);
  });

  /** Stored values come back as written. */
  it("reads stored names, ids and readable colours", async () => {
    const settings = await readerOf({
      "displayName.ar": "متجر النخلة",
      logo: "upl_01jc5w3b4k6m7n8p9q0r1s2t3v",
      primaryColor: "#1D4ED8",
      accentColor: "#B45309",
    }).get(BrandingSettings);
    expect(settings.displayName).toEqual({ en: null, ar: "متجر النخلة" });
    expect(settings.logo).toBe("upl_01jc5w3b4k6m7n8p9q0r1s2t3v");
    expect([settings.primaryColor, settings.accentColor]).toEqual(["#1D4ED8", "#B45309"]);
  });

  /** Contrast is never a read rule: one tenant's bad colour must not break its reads. */
  it("reads a low-contrast primary or accent without throwing", async () => {
    const settings = await readerOf({ primaryColor: "#777777", accentColor: "#AAAAAA" }).get(
      BrandingSettings,
    );
    expect([settings.primaryColor, settings.accentColor]).toEqual(["#777777", "#AAAAAA"]);
  });

  /** The format rules. */
  it("reads a malformed colour, a long name and an id that is not an upload's as unset, without throwing", async () => {
    // the settings page type-checks a write only, so a bad stored value must never break a tenant's documents
    const settings = await readerOf({
      primaryColor: "blue",
      "displayName.en": "x".repeat(81),
      logo: "../secrets.png",
    }).get(BrandingSettings);

    expect(settings.primaryColor).toBeNull();
    expect(settings.displayName.en).toBeNull();
    expect(settings.logo).toBeNull();
  });
});
