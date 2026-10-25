/**
 * Stackra file contract:
 * Purpose: unit tests of `EscposReceiptPrinterDriver`: it sends the ESC/POS receipt, the drawer pulse and an empty
 *          probe to a network printer or an existing device path, answers the address as the printer, and resolves
 *          `unavailable` with no address or a refused connection and `permission_denied` on `EACCES`.
 * Boundary: test only; `node:net` and `node:fs/promises` are mocked, so no socket or device is opened.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0253 (decisions 2 to 4); ADR 0250 (decision 3).
 */
import { EventEmitter } from "node:events";

import { buildConfig } from "@stackra/config";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PeripheralsConfig } from "#config/peripherals.config";
import { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";
import { escposDrawerKick } from "#core/functions/escpos-drawer-kick.function";
import { escposReceipt } from "#core/functions/escpos-receipt.function";
import { EscposReceiptPrinterDriver } from "#desktop/drivers/escpos-receipt-printer.driver";

const node = vi.hoisted(() => ({ createConnection: vi.fn(), open: vi.fn() }));

vi.mock("node:net", () => ({ createConnection: node.createConnection }));
vi.mock("node:fs/promises", () => ({ open: node.open, constants: { O_WRONLY: 1 } }));

const RECEIPT = { orderId: "ord_1", lines: ["Total 12.00"] };

/** The sockets the driver opened, in order. */
const sockets: (EventEmitter & { sent: Uint8Array[] })[] = [];

/** A socket that connects (and records what was sent) or fails with `failure`, once the driver listens. */
function socket(failure?: Error): EventEmitter & { sent: Uint8Array[] } {
  const fake = Object.assign(new EventEmitter(), {
    sent: [] as Uint8Array[],
    setTimeout: vi.fn(),
    destroy: vi.fn(),
    end(bytes: Uint8Array, done: () => void) {
      fake.sent.push(bytes);
      done();
    },
  });
  queueMicrotask(() => (failure ? fake.emit("error", failure) : fake.emit("connect")));
  sockets.push(fake);
  return fake;
}

/** Every connection the driver opens connects, or fails with `failure`. */
function connect(failure?: Error): void {
  node.createConnection.mockImplementation(() => socket(failure));
}

/** The driver over `printerAddress`. */
function driver(printerAddress: string): EscposReceiptPrinterDriver {
  return new EscposReceiptPrinterDriver(
    buildConfig(PeripheralsConfig, { values: { printer: "escpos", printerAddress } }),
  );
}

beforeEach(() => {
  sockets.length = 0;
  node.createConnection.mockReset();
  node.open.mockReset();
});

describe("EscposReceiptPrinterDriver", () => {
  it("refuses with no address and opens nothing", async () => {
    const printer = driver("");
    expect(printer).toBeInstanceOf(ReceiptPrinter);
    expect(await printer.print(RECEIPT)).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "print" },
    });
    expect(node.createConnection).not.toHaveBeenCalled();
    expect(node.open).not.toHaveBeenCalled();
  });

  it("prints to a network printer and answers its address", async () => {
    connect();
    expect(await driver("tcp://10.0.0.20:9100").print(RECEIPT)).toEqual({
      ok: true,
      data: { printer: "tcp://10.0.0.20:9100", orderId: "ord_1" },
    });
    expect(node.createConnection).toHaveBeenCalledWith({ host: "10.0.0.20", port: 9100 });
    expect(sockets.map((opened) => opened.sent)).toEqual([[escposReceipt(RECEIPT.lines)]]);
  });

  it("probes with nothing and pulses the drawer", async () => {
    connect();
    const printer = driver("tcp://printer.local:9100");
    expect(await printer.probe()).toEqual({ ok: true, data: undefined });
    expect(await printer.kickDrawer(2)).toEqual({ ok: true, data: undefined });
    expect(sockets.map((opened) => opened.sent)).toEqual([
      [new Uint8Array(0)],
      [escposDrawerKick(2)],
    ]);
  });

  it("refuses a printer that does not answer", async () => {
    connect(Object.assign(new Error("refused"), { code: "ECONNREFUSED" }));
    expect(await driver("tcp://10.0.0.20:9100").probe()).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "print" },
    });
  });

  it("writes to an existing device without creating it", async () => {
    const device = {
      write: vi.fn().mockResolvedValue({}),
      close: vi.fn().mockResolvedValue(undefined),
    };
    node.open.mockResolvedValue(device);
    expect((await driver("/dev/usb/lp0").print(RECEIPT)).ok).toBe(true);
    expect(node.open).toHaveBeenCalledWith("/dev/usb/lp0", 1);
    expect(device.write).toHaveBeenCalledWith(escposReceipt(RECEIPT.lines));
    expect(device.close).toHaveBeenCalled();
  });

  it("answers permission_denied when the device refuses access", async () => {
    node.open.mockRejectedValue(Object.assign(new Error("denied"), { code: "EACCES" }));
    expect(await driver("/dev/usb/lp0").kickDrawer(5)).toEqual({
      ok: false,
      error: { code: "permission_denied", capability: "print" },
    });
  });
});
