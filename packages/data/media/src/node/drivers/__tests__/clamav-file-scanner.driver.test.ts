/**
 * Stackra file contract:
 * Purpose: unit tests of `ClamavFileScannerDriver`: it frames the file as clamd's INSTREAM command and maps the
 *          reply, refuses a file over the size limit without connecting, and throws when clamd is unreachable.
 * Boundary: test only; a local TCP server on a free port plays clamd, so nothing leaves the machine.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0354.
 */
import { createServer } from "node:net";
import type { AddressInfo, Server } from "node:net";

import { buildConfig } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { MediaConfig } from "#config/media.config";
import { ClamavFileScannerDriver } from "#node/drivers/clamav-file-scanner.driver";

let server: Server | undefined;

/** A fake clamd that records the stream and answers `reply`; resolves its port. */
function clamd(reply: string, received: Buffer[]): Promise<number> {
  return new Promise((resolve) => {
    server = createServer((socket) => {
      socket.on("data", (data) => received.push(Buffer.isBuffer(data) ? data : Buffer.from(data)));
      socket.on("end", () => socket.end(reply));
    });
    server.listen(0, "127.0.0.1", () =>
      resolve(((server as Server).address() as AddressInfo).port),
    );
  });
}

/** The scanner at `port`, streaming at most `maxBytes`. */
function scannerAt(port: number, maxBytes = 1024): ClamavFileScannerDriver {
  return new ClamavFileScannerDriver(
    buildConfig(MediaConfig, {
      values: { scanner: "clamav", clamav: { host: "127.0.0.1", port, maxBytes } },
    }),
  );
}

afterEach(async () => {
  await new Promise((resolve) =>
    server === undefined ? resolve(undefined) : server.close(resolve),
  );
  server = undefined;
});

describe("ClamavFileScannerDriver", () => {
  it("streams the file as INSTREAM frames and maps the verdict", async () => {
    const received: Buffer[] = [];
    const port = await clamd("stream: Eicar-Signature FOUND\0", received);
    const result = await scannerAt(port).scan("uploads/a", async () => new Uint8Array([7, 8, 9]));
    expect(result).toEqual({ verdict: "infected", threats: ["Eicar-Signature"] });
    const stream = Buffer.concat(received);
    expect(stream.subarray(0, 10).toString()).toBe("zINSTREAM\0");
    expect(stream.readUInt32BE(10)).toBe(3);
    expect([...stream.subarray(14, 17)]).toEqual([7, 8, 9]);
    expect(stream.readUInt32BE(17)).toBe(0);
  });

  it("fails a file over the limit without connecting", async () => {
    const result = await scannerAt(1, 2).scan("uploads/a", async () => new Uint8Array(3));
    expect(result).toMatchObject({ verdict: "failed", detail: "larger than 2 bytes" });
  });

  it("throws when clamd cannot be reached", async () => {
    const port = await clamd("", []);
    await new Promise((resolve) => server?.close(resolve));
    server = undefined;
    await expect(
      scannerAt(port).scan("uploads/a", async () => new Uint8Array(1)),
    ).rejects.toThrow();
  });
});
