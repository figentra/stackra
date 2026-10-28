/**
 * Stackra file contract:
 * Purpose: `sendToPrinter`, the one way main sends bytes to a printer: a network printer (`tcp://<host>:<port>`, raw
 *          port 9100 style) or an existing device path (`/dev/usb/lp0`, `\\localhost\<share>`), resolving once the
 *          bytes are flushed. The receipt and label drivers share it.
 * Boundary: main only, with no native module (ADR 0253 decision 3). Node modules load when it runs, so the entry stays
 *           loadable anywhere. A device path is opened for writing without creating it. A refused connection, a
 *           timeout or a missing path rejects with the Node error, whose `code` the driver turns into a refusal.
 * Runtime: node
 * Governing contract: ADR 0339 (decision 5: Electron reaches printers through main); ADR 0253 (decisions 2 to 4).
 */

/** How long a network printer has to accept the job, in milliseconds. */
const TIMEOUT = 5000;

/** Sends `bytes` to a network printer and resolves once they are flushed. */
async function sendOverTcp(address: string, bytes: Uint8Array): Promise<void> {
  const { createConnection } = await import("node:net");
  const url = new URL(address);
  const host = url.hostname.replaceAll(/^\[|\]$/g, "");
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
 * Sends `bytes` to the printer at `address`.
 *
 * @example
 * await sendToPrinter("tcp://10.0.0.21:9100", new TextEncoder().encode(zpl));
 * @throws the Node error of the connection or the device (`ECONNREFUSED`, `EACCES`, `ENOENT`, a timeout).
 */
export async function sendToPrinter(address: string, bytes: Uint8Array): Promise<void> {
  if (address.startsWith("tcp://")) await sendOverTcp(address, bytes);
  else await sendToDevice(address, bytes);
}
