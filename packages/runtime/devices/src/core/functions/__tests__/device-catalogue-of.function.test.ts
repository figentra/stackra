/**
 * Stackra file contract:
 * Purpose: unit tests of `deviceCatalogueOf`: the base catalogue reads (kiosk, lane, lane display and gate are
 *          unattended; the gate drives the access controller), and a row of another record, a bad or repeated key, a
 *          missing flag or a bad peripheral name is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0430 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { BASE_DEVICE_CATALOGUE } from "#core/constants/base-device-catalogue.constant";
import { deviceCatalogueOf } from "#core/functions/device-catalogue-of.function";

describe("deviceCatalogueOf", () => {
  it("reads the base catalogue", () => {
    const kinds = deviceCatalogueOf(BASE_DEVICE_CATALOGUE);
    expect(kinds.map((kind) => kind.key)).toEqual([
      "till",
      "kiosk",
      "lane",
      "lane_display",
      "gate",
    ]);
    expect(kinds.filter((kind) => kind.unattended).map((kind) => kind.key)).toEqual([
      "kiosk",
      "lane",
      "lane_display",
      "gate",
    ]);
    expect(kinds.find((kind) => kind.key === "gate")?.peripherals).toEqual(["access_controller"]);
  });

  it("refuses a bad row", () => {
    const good = {
      record: "device_kind",
      key: "kiosk",
      unattended: true,
      customerFacing: true,
      peripherals: [],
    };
    expect(() => deviceCatalogueOf([{ ...good, record: "tier" }])).toThrow(/not a device_kind/);
    expect(() => deviceCatalogueOf([{ ...good, key: "Kiosk" }])).toThrow(/snake_case key/);
    expect(() => deviceCatalogueOf([good, good])).toThrow(/repeats kiosk/);
    expect(() => deviceCatalogueOf([{ ...good, unattended: "yes" }])).toThrow(/true or false/);
    expect(() => deviceCatalogueOf([{ ...good, peripherals: ["Scale"] }])).toThrow(
      /peripheral names/,
    );
  });
});
