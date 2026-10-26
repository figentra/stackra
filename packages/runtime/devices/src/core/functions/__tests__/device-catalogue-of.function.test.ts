/**
 * Stackra file contract:
 * Purpose: unit tests of `deviceCatalogueOf`: the base catalogue reads (kiosk, lane, lane display and gate are
 *          unattended; the gate drives the access controller), and a row of another record, a bad or repeated key, a
 *          missing flag or a bad peripheral name is refused; `counted` and `fiscalUnit` read from the row, default to
 *          counted and not fiscal, and refuse a value that is not true or false.
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
    expect(kinds.filter((kind) => !kind.counted).map((kind) => kind.key)).toEqual(["lane_display"]);
    expect(kinds.filter((kind) => kind.fiscalUnit).map((kind) => kind.key)).toEqual([
      "till",
      "kiosk",
      "lane",
    ]);
  });

  it("defaults counted and fiscalUnit for a row without them", () => {
    const [kind] = deviceCatalogueOf([
      {
        record: "device_kind",
        key: "scale",
        unattended: true,
        customerFacing: false,
        peripherals: [],
      },
    ]);
    expect(kind).toMatchObject({ counted: true, fiscalUnit: false });
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
    expect(() => deviceCatalogueOf([{ ...good, counted: "no" }])).toThrow(/counted and fiscalUnit/);
    expect(() => deviceCatalogueOf([{ ...good, fiscalUnit: null }])).toThrow(
      /counted and fiscalUnit/,
    );
    expect(() => deviceCatalogueOf([{ ...good, peripherals: ["Scale"] }])).toThrow(
      /peripheral names/,
    );
  });
});
