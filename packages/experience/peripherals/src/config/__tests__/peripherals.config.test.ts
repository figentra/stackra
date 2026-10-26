/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PeripheralsConfig`: a configuration over `PeripheralsOptions` keyed `peripherals`
 *          (so gen's selectors are `config:peripherals.printer`, `.drawer` and `.scanner`), built with its defaults,
 *          the template console's override and a runway values layer, and refusing a driver or an address this
 *          package does not take.
 * Boundary: test only. The override below is the console's `src/config/peripherals.config.ts`, verbatim.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19, 20 and 26); ADR 0253 (decision 4).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PeripheralsConfig } from "#config/peripherals.config";
import type { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";
import type { CashDrawer } from "#contracts/ports/cash-drawer.port";
import type { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";

/** The console's override, under the plain name with the package class aliased. */
const BasePeripheralsConfig = PeripheralsConfig;

class ConsolePeripheralsConfig extends BasePeripheralsConfig {
  override printer: DriverName<ReceiptPrinter> = "escpos";

  override drawer: DriverName<CashDrawer> = "printer_kick";

  override scanner: DriverName<BarcodeScanner> = "hid";

  override probeOnBoot = true;
}

describe("PeripheralsConfig", () => {
  it("is a configuration keyed peripherals, an override inheriting the key", () => {
    expect(new PeripheralsConfig()).toBeInstanceOf(Config);
    expect(configKey(PeripheralsConfig, "peripherals")).toBe("peripherals");
    expect(configKey(ConsolePeripheralsConfig, "peripherals")).toBe("peripherals");
  });

  it("builds with the memory drivers and no device", () => {
    const config = buildConfig(PeripheralsConfig);
    expectTypeOf(config.printer).toEqualTypeOf<DriverName<ReceiptPrinter>>();
    expect(config.printer).toBe("memory");
    expect(config.drawer).toBe("memory");
    expect(config.scanner).toBe("memory");
    expect(config.printerAddress).toBe("");
    expect(config.drawerPin).toBe(2);
    expect(config.scanKeyGap).toBe("PT0.05S");
    expect(config.probeOnBoot).toBe(false);
    expect(config.accessController).toBe("memory");
    expect(config.exitTokenPublicKey).toBe("");
    expect(config.exitTokenMaxAge).toBe("PT30M");
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("builds the console's override and a runway layer", () => {
    const config = buildConfig(ConsolePeripheralsConfig, {
      values: { printerAddress: "tcp://10.0.0.20:9100", drawerPin: 5 },
    });
    expect(config.printer).toBe("escpos");
    expect(config.drawer).toBe("printer_kick");
    expect(config.scanner).toBe("hid");
    expect(config.probeOnBoot).toBe(true);
    expect(config.printerAddress).toBe("tcp://10.0.0.20:9100");
    expect(config.drawerPin).toBe(5);
  });

  it("refuses a driver this package does not ship and an address it cannot reach", () => {
    // @ts-expect-error -- "star" is no driver this package ships; the runtime refusal is the subject
    expect(() => buildConfig(PeripheralsConfig, { values: { printer: "star" } })).toThrow(
      ConfigInvalidError,
    );
    expect(() =>
      buildConfig(PeripheralsConfig, { values: { printerAddress: "printer.local" } }),
    ).toThrow(ConfigInvalidError);
    expect(() =>
      buildConfig(PeripheralsConfig, { values: { exitTokenPublicKey: "not a key" } }),
    ).toThrow(ConfigInvalidError);
  });
});
