/**
 * Stackra file contract:
 * Purpose: unit tests of `EscposKitchenPrinterDriver`: a ticket goes to the named printer serving its station, with
 *          that printer's buzzer, and the result names the printer; a station no printer serves refuses
 *          `unavailable` without sending; a refused connection resolves `unavailable` and `EACCES` `permission_denied`.
 * Boundary: test only; `sendToPrinter` is mocked, so no socket or device is opened.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0339 (decisions 2 and 5); ADR 0449 (decision 1).
 */
import { buildConfig } from "@stackra/config";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PeripheralsConfig } from "#config/peripherals.config";
import { KitchenPrinter } from "#contracts/ports/kitchen-printer.port";
import { escposKitchenTicket } from "#core/functions/escpos-kitchen-ticket.function";
import { EscposKitchenPrinterDriver } from "#desktop/drivers/escpos-kitchen-printer.driver";

const sent = vi.hoisted(() => vi.fn());

vi.mock("#desktop/functions/send-to-printer.function", () => ({ sendToPrinter: sent }));

/** The driver over two named printers. */
function driver(): EscposKitchenPrinterDriver {
  return new EscposKitchenPrinterDriver(
    buildConfig(PeripheralsConfig, {
      values: {
        kitchenPrinter: "escpos",
        kitchenPrinters: {
          grill: {
            address: "tcp://10.0.0.30:9100",
            stations: ["grill"],
            buzz: { times: 2, length: 3 },
          },
          cold_line: { address: "/dev/usb/lp1", stations: ["cold", "dessert"], buzz: null },
        },
      },
    }),
  );
}

beforeEach(() => {
  sent.mockReset();
  sent.mockResolvedValue(undefined);
});

describe("EscposKitchenPrinterDriver", () => {
  it("prints on the station's named printer with its buzzer", async () => {
    const kitchen = driver();
    expect(kitchen).toBeInstanceOf(KitchenPrinter);
    const grill = { orderId: "ord_1", station: "grill", lines: ["2x Shawarma"] };
    expect(await kitchen.print(grill)).toEqual({
      ok: true,
      data: { printer: "grill", orderId: "ord_1" },
    });
    expect(sent).toHaveBeenLastCalledWith(
      "tcp://10.0.0.30:9100",
      escposKitchenTicket(grill, { times: 2, length: 3 }),
    );
    const dessert = { orderId: "ord_1", station: "dessert", lines: ["Kunafa"] };
    expect(await kitchen.print(dessert)).toMatchObject({
      ok: true,
      data: { printer: "cold_line" },
    });
    expect(sent).toHaveBeenLastCalledWith("/dev/usb/lp1", escposKitchenTicket(dessert, null));
    expect(await kitchen.probe("cold")).toEqual({ ok: true, data: undefined });
  });

  it("refuses a station no printer serves without sending", async () => {
    const kitchen = driver();
    const refused = { ok: false, error: { code: "unavailable", capability: "print" } };
    expect(await kitchen.print({ orderId: "ord_1", station: "bar", lines: [] })).toEqual(refused);
    expect(await kitchen.probe("bar")).toEqual(refused);
    expect(sent).not.toHaveBeenCalled();
  });

  it("turns a refused connection and a denied device into refusals", async () => {
    const kitchen = driver();
    const ticket = { orderId: "ord_1", station: "grill", lines: ["x"] };
    sent.mockRejectedValueOnce(Object.assign(new Error("refused"), { code: "ECONNREFUSED" }));
    expect(await kitchen.print(ticket)).toMatchObject({
      ok: false,
      error: { code: "unavailable" },
    });
    sent.mockRejectedValueOnce(Object.assign(new Error("denied"), { code: "EACCES" }));
    expect(await kitchen.print(ticket)).toMatchObject({
      ok: false,
      error: { code: "permission_denied" },
    });
  });
});
