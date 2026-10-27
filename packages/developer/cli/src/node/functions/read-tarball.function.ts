/**
 * Stackra file contract:
 * Purpose: `readTarball(tgz)`, the regular files of an npm `.tgz` by path, with npm's leading `package/` folder
 *          removed. Reads ustar headers, their `prefix` field and pax `path` records (long names).
 * Boundary: reads bytes only, writes nothing. Refuses a path that is empty, absolute or climbs out (`..`), so a
 *           tarball can never write outside its install folder; links and devices are skipped.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11: every item is an npm tarball).
 */
import { gunzipSync } from "node:zlib";

const BLOCK = 512;
const decoder = new TextDecoder();

/**
 * The files of an npm tarball.
 *
 * @param tgz - the gzipped tarball.
 * @example
 * readTarball(bytes).get("SKILL.md");
 */
export function readTarball(tgz: Uint8Array): Map<string, Uint8Array> {
  // shortcut: a minimal ustar reader instead of a tar dependency; it reads what `npm pack` and `pnpm pack` write.
  const tar = gunzipSync(tgz);
  const files = new Map<string, Uint8Array>();
  let paxPath: string | undefined;
  for (let at = 0; at + BLOCK <= tar.length;) {
    const header = tar.subarray(at, at + BLOCK);
    if (header.every((byte) => byte === 0)) break;
    const field = (offset: number, length: number) =>
      decoder.decode(header.subarray(offset, offset + length)).replace(/\0[\s\S]*$/, "");
    const size = Number.parseInt(field(124, 12).trim() || "0", 8);
    const type = field(156, 1) || "0";
    const prefix = field(345, 155);
    const name = paxPath ?? (prefix === "" ? field(0, 100) : `${prefix}/${field(0, 100)}`);
    const body = tar.subarray(at + BLOCK, at + BLOCK + size);
    at += BLOCK + Math.ceil(size / BLOCK) * BLOCK;
    if (type === "x") {
      paxPath = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(decoder.decode(body))?.[1];
      continue;
    }
    paxPath = undefined;
    if (type !== "0") continue;
    const segments = name.split("/").slice(1);
    if (
      segments.length === 0 ||
      segments.some((segment) => segment === "" || segment === ".." || segment.includes("\\"))
    ) {
      throw new Error(`the tarball holds a path outside its folder: ${name}`);
    }
    files.set(segments.join("/"), body.slice());
  }
  return files;
}
