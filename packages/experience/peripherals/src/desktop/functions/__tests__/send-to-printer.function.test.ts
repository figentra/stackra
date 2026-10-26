/**
 * Stackra file contract:
 * Purpose: unit tests of `sendToPrinter`: a `tcp://` address connects to its host and port and ends with the bytes, a
 *          device path is opened write-only (never created), written and closed, and a connection error rejects.
 * Boundary: test only; `node:net` and `node:fs/promises` are mocked, so no socket or device is opened.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0339 (decision 5); ADR 0253.
 */
import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { sendToPrinter } from "#desktop/functions/send-to-printer.function";

const node = vi.hoisted(() => ({ createConnection: vi.fn(), open: vi.fn() }));

vi.mock("node:net", () => ({ createConnection: node.createConnection }));
vi.mock("node:fs/promises", () => ({ open: node.open, constants: { O_WRONLY: 1 } }));

/** `createConnection` hands out a socket that connects and records the bytes, or fails with `failure`. */
function connectWith(failure?: Error) {
  const fake = Object.assign(new EventEmitter(), {
    sent: [] as Uint8Array[],
    setTimeout: vi.fn(),
    destroy: vi.fn(),
    end(bytes: Uint8Array, done: () => void) {
      fake.sent.push(bytes);
      done();
    },
  });
  // Emitted after the call, once the caller has attached its listeners (the import before it takes longer than a
  // microtask, so emitting from here would be missed).
  node.createConnection.mockImplementation(() => {
    queueMicrotask(() => (failure ? fake.emit("error", failure) : fake.emit("connect")));
    return fake;
  });
  return fake;
}

beforeEach(() => {
  node.createConnection.mockReset();
  node.open.mockReset();
});

describe("sendToPrinter", () => {
  it("sends to a network printer", async () => {
    const fake = connectWith();
    await sendToPrinter("tcp://10.0.0.21:9100", Uint8Array.of(1, 2));
    expect(node.createConnection).toHaveBeenCalledWith({ host: "10.0.0.21", port: 9100 });
    expect(fake.sent).toEqual([Uint8Array.of(1, 2)]);
  });

  it("writes to an existing device path", async () => {
    const device = { write: vi.fn(async () => undefined), close: vi.fn(async () => undefined) };
    node.open.mockResolvedValue(device);
    await sendToPrinter("/dev/usb/lp1", Uint8Array.of(3));
    expect(node.open).toHaveBeenCalledWith("/dev/usb/lp1", 1);
    expect(device.write).toHaveBeenCalledWith(Uint8Array.of(3));
    expect(device.close).toHaveBeenCalled();
  });

  it("rejects with the connection's error", async () => {
    const refused = Object.assign(new Error("refused"), { code: "ECONNREFUSED" });
    connectWith(refused);
    await expect(sendToPrinter("tcp://10.0.0.21:9100", Uint8Array.of(1))).rejects.toBe(refused);
  });
});
