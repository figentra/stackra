/**
 * Stackra file contract:
 * Purpose: unit tests of `CfIpcountryRegionSourceDriver`: a driver of `RegionSource` that reads `cf-ipcountry`,
 *          upper-cases and trims it, and reads `XX`, `T1`, a missing header and anything not two letters as unknown;
 *          and its value fed to `ConsentLedger.setRegion` picks the region's regime.
 * Boundary: test only; builds plain `Headers`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0298 (decision 4); ADR 0263.
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { ConsentConfig } from "#config/consent.config";
import { RegionSource } from "#contracts/ports/region-source.port";
import { CfIpcountryRegionSourceDriver } from "#core/drivers/cf-ipcountry-region-source.driver";
import { MemoryConsentStoreDriver } from "#core/drivers/memory-consent-store.driver";
import { ConsentCategory } from "#core/enums/consent-category.enum";
import { ConsentRegime } from "#core/enums/consent-regime.enum";
import { ConsentStatus } from "#core/enums/consent-status.enum";
import { ConsentLedger } from "#core/services/consent-ledger.service";

const source = new CfIpcountryRegionSourceDriver();

/** The region read from a request whose `cf-ipcountry` is `value`. */
const regionFor = (value: string) => source.regionOf(new Headers({ "cf-ipcountry": value }));

describe("CfIpcountryRegionSourceDriver", () => {
  it("is a driver of RegionSource", () => {
    expect(source).toBeInstanceOf(RegionSource);
    expect(kindOf(CfIpcountryRegionSourceDriver)?.kind).toBe("driver");
  });

  it("reads the country, upper case", () => {
    expect(regionFor("SA")).toBe("SA");
    expect(regionFor(" br ")).toBe("BR");
  });

  it.each([["XX"], ["T1"], [""], ["USA"], ["1A"]])("reads %j as unknown", (value) => {
    expect(regionFor(value)).toBeNull();
  });

  it("reads a missing header as unknown", () => {
    expect(source.regionOf(new Headers())).toBeNull();
  });

  it("feeds the ledger's regional default", () => {
    const config = buildConfig(ConsentConfig, {
      values: {
        categories: [
          {
            category: ConsentCategory.Necessary,
            required: true,
            defaultGranted: true,
            descriptionKey: null,
          },
          {
            category: ConsentCategory.Analytics,
            required: false,
            defaultGranted: true,
            descriptionKey: null,
          },
        ],
        regionDefaults: {
          default: ConsentRegime.Gdpr,
          US: ConsentRegime.Ccpa,
          SA: ConsentRegime.PdplSa,
        },
      },
    });
    const ledger = new ConsentLedger(config, new MemoryConsentStoreDriver());
    ledger.setRegion(regionFor("US"));
    expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Granted);
    ledger.setRegion(regionFor("SA"));
    expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Undecided);
  });
});
