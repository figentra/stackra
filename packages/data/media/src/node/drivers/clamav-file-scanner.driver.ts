/**
 * Stackra file contract:
 * Purpose: the `clamav` driver of `FileScanner`: streams the file to a clamd daemon with the `INSTREAM` command and
 *          reads its verdict, for the regions where AWS GuardDuty malware protection is not offered (GCP Dammam) and
 *          for a local stack.
 * Boundary: talks to clamd over TCP at `media.clamav.{host, port}`; a file larger than `media.clamav.maxBytes` is not
 *           sent and is `failed`, as clamd itself would refuse it. clamd's `FOUND` is `infected` with the signature
 *           name, its `ERROR` is `failed`; a connection that fails or times out throws, so the caller retries. The
 *           daemon and its signature updates are the infrastructure package's.
 * Runtime: node
 * Governing contract: ADR 0354 (ClamAV where GuardDuty is not offered); ADR 0222; OS-142.
 */
import { connect } from "node:net";

import { Driver } from "@stackra/container";

import type { MediaConfig } from "#config/media.config";
import { ScanVerdict } from "#contracts/enums/scan-verdict.enum";
import { FileScanner } from "#contracts/ports/file-scanner.port";
import type { ScanResult } from "#contracts/types/scan-result.type";
import { clamdResult } from "#node/functions/clamd-result.function";

/** The most bytes sent in one INSTREAM chunk. */
const CHUNK = 64 * 1024;

/** How long a scan may take before the connection is dropped. */
const TIMEOUT_MS = 60_000;

/** The INSTREAM frames of `bytes`: each chunk with its 4-byte big-endian length, then a zero length. */
function framesOf(bytes: Uint8Array): Buffer {
  const parts: Buffer[] = [Buffer.from("zINSTREAM\0")];
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    const chunk = bytes.subarray(offset, offset + CHUNK);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(chunk.length);
    parts.push(length, Buffer.from(chunk));
  }
  parts.push(Buffer.alloc(4));
  return Buffer.concat(parts);
}

/**
 * Scans with clamd.
 *
 * @example
 * // runway.yaml (ksa): config.media: { scanner: clamav, clamav: { host: clamd.internal, port: 3310 } }
 */
export class ClamavFileScannerDriver extends Driver(FileScanner) {
  private readonly host: string;

  private readonly port: number;

  private readonly maxBytes: number;

  /** @param config - the clamd address and the largest file streamed (`clamav`). */
  constructor(config: MediaConfig) {
    super();
    this.host = config.clamav.host;
    this.port = config.clamav.port;
    this.maxBytes = config.clamav.maxBytes;
  }

  /**
   * Streams the file to clamd and maps its verdict.
   *
   * @throws Error when clamd cannot be reached or does not answer in time.
   */
  async scan(_path: string, read: () => Promise<Uint8Array>): Promise<ScanResult> {
    const bytes = await read();
    if (bytes.length > this.maxBytes)
      return {
        verdict: ScanVerdict.Failed,
        threats: [],
        detail: `larger than ${this.maxBytes} bytes`,
      };
    const reply = await new Promise<string>((resolve, reject) => {
      const socket = connect({ host: this.host, port: this.port });
      const received: Buffer[] = [];
      socket.setTimeout(TIMEOUT_MS, () =>
        socket.destroy(new Error("clamd did not answer in time")),
      );
      socket.on("connect", () => socket.end(framesOf(bytes)));
      socket.on("data", (data: Buffer) => received.push(data));
      socket.on("error", reject);
      socket.on("close", (failed: boolean) => {
        if (!failed) resolve(Buffer.concat(received).toString("utf8"));
      });
    });
    return clamdResult(reply);
  }
}
