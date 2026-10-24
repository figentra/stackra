/**
 * Stackra file contract:
 * Purpose: `EscposReceiptPrinterDriver`, the `ReceiptPrinter` driver of the desktop main process (`peripherals.printer:
 *          "escpos"`): it sends ESC/POS bytes to `peripherals.printerAddress`, a network printer (`tcp://<host>:<port>`)
 *          or a device path (`/dev/usb/lp0` on Linux, a shared printer `\\localhost\<share>` on Windows).
 * Boundary: main only, with no native module (ADR 0253 decision 3): a USB printer on macOS needs a network address. A
 *           device path is opened for writing without creating it, so a wrong path refuses instead of filling a file.
 *           No address, a refused connection or a timeout resolves `unavailable`; `EACCES` or `EPERM` resolves
 *           `permission_denied`. Node modules load when a call runs, so the entry stays loadable anywhere.
 * Runtime: node
 * Governing contract: ADR 0253 (decisions 2 to 4); ADR 0250 (decision 3); ADR 0254 (the desktop baseline: work that
 *                     needs Node runs in main).
 */
import { Driver } from "@stackra/container";
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { PeripheralsConfig } from "#config/peripherals.config";
import { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";
import type { DrawerPin } from "#contracts/types/drawer-pin.type";
import type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
import type { Receipt } from "#contracts/types/receipt.type";
import { escposDrawerKick } from "#core/functions/escpos-drawer-kick.function";
import { escposReceipt } from "#core/functions/escpos-receipt.function";
import { refuse } from "#core/functions/refuse.function";

/** How long a network printer has to accept the job, in milliseconds. */
const TIMEOUT = 5000;

/** Sends `bytes` to a network printer and resolves once they are flushed. */
async function sendOverTcp(address: string, bytes: Uint8Array): Promise<void> {
  const { createConnection } = await import("node:net");
  const url = new URL(address);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  await new Promise<void>((resolve, reject) => {
    const socket = createConnection({ host, port: Number(url.port) });
    socket.setTimeout(TIMEOUT, () => socket.destroy(new Error(`${address} timed out`)));
    // `on`, not `once`: a second error (a reset after the timeout) must not reach main as an unhandled event.
    socket.on("error", reject);
    socket.once("connect", () => socket.end(bytes, () => resolve()));
  });
}

/** Writes `bytes` to an existing device path. */
async function sendToDevice(path: string, bytes: Uint8Array): Promise<void> {
  const { constants, open } = await import("node:fs/promises");
  const device = await open(path, constants.O_WRONLY);
  try {
    await device.write(bytes);
  } finally {
    await device.close();
  }
}

/**
 * An ESC/POS receipt printer reached from main.
 *
 * @example
 * // generated main-process wiring, desktop target
 * { port: ReceiptPrinter, selectedBy: "config:peripherals.printer", candidates: { escpos: () => import("@stackra/peripherals/electron").then((m) => m.EscposReceiptPrinterDriver) } }
 */
export class EscposReceiptPrinterDriver extends Driver(ReceiptPrinter) {
  /** The peripherals configuration, for the printer's address. */
  private readonly config: PeripheralsConfig;

  /** @param config - the peripherals configuration. */
  constructor(config: PeripheralsConfig) {
    super();
    this.config = config;
  }

  /** Opens the connection or the device and sends nothing. */
  async probe(): Promise<CapabilityResult> {
    return this.send(new Uint8Array(0));
  }

  /** Prints the lines and cuts. */
  async print(receipt: Receipt): Promise<CapabilityResult<PrintedReceipt>> {
    const sent = await this.send(escposReceipt(receipt.lines));
    if (!sent.ok) return sent;
    return { ok: true, data: { printer: this.config.printerAddress, orderId: receipt.orderId } };
  }

  /** Pulses the drawer connector. */
  async kickDrawer(pin: DrawerPin): Promise<CapabilityResult> {
    return this.send(escposDrawerKick(pin));
  }

  /** Sends `bytes` to the configured address, as a result. */
  private async send(bytes: Uint8Array): Promise<CapabilityResult> {
    const address = this.config.printerAddress;
    if (address === "") return refuse(Capability.Print, "unavailable");
    try {
      if (address.startsWith("tcp://")) await sendOverTcp(address, bytes);
      else await sendToDevice(address, bytes);
      return { ok: true, data: undefined };
    } catch (error) {
      const code = (error as { readonly code?: unknown }).code;
      return refuse(
        Capability.Print,
        code === "EACCES" || code === "EPERM" ? "permission_denied" : "unavailable",
      );
    }
  }
}
