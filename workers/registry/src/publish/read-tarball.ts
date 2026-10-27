/**
 * Stackra file contract:
 * Purpose: `readTarball`: the files and package.json of an npm tarball.
 * Boundary: reads bytes only; keeps no file body but package.json. Throws `TarballError` on a malformed archive, a
 *           missing package.json or an unpacked size over the limit.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 7).
 */
import type { Bytes } from "#src/interfaces/bytes.type";
import type { TarballContents } from "#src/interfaces/tarball-contents.interface";
import { TarballError } from "#src/publish/tarball-error";

const BLOCK = 512;

const decoder = new TextDecoder();

/** Gunzips, refusing an output larger than `limit`. */
async function gunzip(bytes: Bytes, limit: number): Promise<Uint8Array> {
  const reader = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > limit) {
        await reader.cancel();
        throw new TarballError(`tarball unpacks to more than ${limit} bytes`);
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof TarballError) throw error;
    throw new TarballError("tarball is not valid gzip");
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

/** A NUL-terminated header field. */
const field = (block: Uint8Array, start: number, length: number): string => {
  const raw = block.subarray(start, start + length);
  const end = raw.indexOf(0);
  return decoder.decode(end === -1 ? raw : raw.subarray(0, end));
};

/** The `path` record of a pax header body. */
const paxPath = (body: Uint8Array): string | null => {
  for (const line of decoder.decode(body).split("\n")) {
    const match = /^\d+ path=(.*)$/.exec(line);
    if (match?.[1] !== undefined) return match[1];
  }
  return null;
};

/**
 * The files and package.json of an npm tarball.
 *
 * @param bytes - the `.tgz` bytes.
 * @param maxUnpackedBytes - the largest unpacked size read.
 * @example
 * const { files, packageJson } = await readTarball(tgz, 104857600);
 */
export async function readTarball(
  bytes: Bytes,
  maxUnpackedBytes: number,
): Promise<TarballContents> {
  const tar = await gunzip(bytes, maxUnpackedBytes);
  const files: string[] = [];
  let packageJson: Record<string, unknown> | null = null;
  let longName: string | null = null;
  for (let at = 0; at + BLOCK <= tar.length;) {
    const header = tar.subarray(at, at + BLOCK);
    if (header.every((byte) => byte === 0)) break;
    const size = Number.parseInt(field(header, 124, 12).trim() || "0", 8);
    if (!Number.isFinite(size) || size < 0) throw new TarballError("tarball header is malformed");
    const type = String.fromCharCode(header[156] ?? 0);
    const body = tar.subarray(at + BLOCK, at + BLOCK + size);
    at += BLOCK + Math.ceil(size / BLOCK) * BLOCK;
    if (type === "x") {
      longName = paxPath(body);
      continue;
    }
    if (type === "L") {
      longName = field(body, 0, body.length);
      continue;
    }
    if (type === "g") continue;
    const prefix = field(header, 345, 155);
    const name =
      longName ?? (prefix === "" ? field(header, 0, 100) : `${prefix}/${field(header, 0, 100)}`);
    longName = null;
    if (type !== "0" && type !== "\0") continue;
    const path = name.slice(name.indexOf("/") + 1);
    files.push(path);
    if (path === "package.json") {
      try {
        packageJson = JSON.parse(decoder.decode(body)) as Record<string, unknown>;
      } catch {
        throw new TarballError("package.json is not valid JSON");
      }
    }
  }
  if (packageJson === null) throw new TarballError("tarball has no package.json");
  return { files, packageJson };
}
