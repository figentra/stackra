/**
 * Stackra file contract:
 * Purpose: unit tests of `PERIPHERALS_CONFIG_SCHEMA`: `.parse({})` gives the memory drivers and no device, the
 *          address forms and pins it takes pass, and an unknown driver, a bare host, a third pin or a zero key gap is
 *          refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26); ADR 0253 (decision 4); STA-965.
 */
import { describe, expect, it } from "@stackra/testing";

import { PERIPHERALS_CONFIG_SCHEMA } from "#core/constants/peripherals-config-schema.constant";

describe("PERIPHERALS_CONFIG_SCHEMA", () => {
  it("defaults to the memory drivers and no device", () => {
    expect(PERIPHERALS_CONFIG_SCHEMA.parse({})).toEqual({
      printer: "memory",
      drawer: "memory",
      scanner: "memory",
      labelPrinter: "memory",
      customerDisplay: "memory",
      cardTerminal: "memory",
      accessController: "memory",
      kitchenPrinter: "memory",
      bumpBar: "memory",
      usedReceiptStore: "memory",
      scannerScale: "memory",
      baggingScale: "memory",
      labelScale: "memory",
      driveThroughLane: "memory",
      printerAddress: "",
      labelPrinterAddress: "",
      kitchenPrinters: {},
      bumpBarKeys: {
        Enter: "bump",
        r: "recall",
        ArrowRight: "next",
        ArrowLeft: "previous",
        " ": "select",
      },
      scalePresets: {
        retail: { division: 1, capacity: 15_000 },
        precision: { division: 0.01, capacity: 600 },
      },
      scalePreset: "retail",
      drawerPin: 2,
      scanKeyGap: "PT0.05S",
      probeOnBoot: false,
      exitTokenPublicKey: "",
      exitTokenMaxAge: "PT30M",
    });
  });

  it("takes a network printer, a device path and either pin", () => {
    for (const printerAddress of ["tcp://10.0.0.20:9100", "/dev/usb/lp0", "\\\\localhost\\Receipt"])
      expect(PERIPHERALS_CONFIG_SCHEMA.safeParse({ printerAddress }).success).toBe(true);
    expect(PERIPHERALS_CONFIG_SCHEMA.parse({ drawerPin: 5 }).drawerPin).toBe(5);
  });

  it("takes named kitchen printers, each station on one printer, with or without a buzzer", () => {
    const kitchenPrinters = {
      grill: {
        address: "tcp://10.0.0.30:9100",
        stations: ["grill"],
        buzz: { times: 2, length: 3 },
      },
      cold_line: { address: "/dev/usb/lp1", stations: ["cold", "dessert"], buzz: null },
    };
    expect(PERIPHERALS_CONFIG_SCHEMA.parse({ kitchenPrinters }).kitchenPrinters).toEqual(
      kitchenPrinters,
    );
  });

  it("refuses what no driver can use", () => {
    for (const values of [
      { printer: "star" },
      { scanner: "keyboard" },
      { labelPrinter: "epl" },
      { customerDisplay: "pole" },
      { labelPrinterAddress: "labels.local" },
      { printerAddress: "printer.local" },
      { printerAddress: "tcp://10.0.0.20" },
      { drawerPin: 3 },
      { scanKeyGap: "PT0S" },
      { scanKeyGap: "50ms" },
      { kitchenPrinter: "star" },
      { kitchenPrinters: { grill: { address: "", stations: ["grill"], buzz: null } } },
      { kitchenPrinters: { grill: { address: "/dev/lp0", stations: [], buzz: null } } },
      {
        kitchenPrinters: {
          grill: { address: "/dev/lp0", stations: ["grill"], buzz: { times: 10, length: 1 } },
        },
      },
      {
        kitchenPrinters: {
          a: { address: "/dev/lp0", stations: ["grill"], buzz: null },
          b: { address: "/dev/lp1", stations: ["grill"], buzz: null },
        },
      },
      { bumpBarKeys: { Enter: "delete" } },
      { scalePresets: { precision: { division: 0, capacity: 600 } } },
      { usedReceiptStore: "redis" },
      { scannerScale: "datalogic" },
      { driveThroughLane: "hme" },
    ])
      expect(PERIPHERALS_CONFIG_SCHEMA.safeParse(values).success).toBe(false);
  });
});
