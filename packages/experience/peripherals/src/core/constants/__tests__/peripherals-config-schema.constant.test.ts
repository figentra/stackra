/**
 * Stackra file contract:
 * Purpose: unit tests of `PERIPHERALS_CONFIG_SCHEMA`: `.parse({})` gives the memory drivers and no device, the
 *          address forms and pins it takes pass, and an unknown driver, a bare host, a third pin or a zero key gap is
 *          refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26); ADR 0253 (decision 4).
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
      printerAddress: "",
      labelPrinterAddress: "",
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
    ])
      expect(PERIPHERALS_CONFIG_SCHEMA.safeParse(values).success).toBe(false);
  });
});
