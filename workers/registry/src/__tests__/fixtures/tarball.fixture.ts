/**
 * Stackra file contract:
 * Purpose: `makeTarball(files)`, an npm-shaped `.tgz` (ustar under `package/`, gzip) built in memory for the tests,
 *          with a pax `path` header for names over 100 characters.
 * Boundary: test fixture only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 7).
 */
import { gzipSync } from "node:zlib";

const BLOCK = 512;

/** One tar header block. */
function header(name: string, size: number, type: string): Uint8Array {
  const block = new Uint8Array(BLOCK);
  const put = (text: string, at: number) => block.set(new TextEncoder().encode(text), at);
  put(name.slice(0, 100), 0);
  put("0000644\0", 100);
  put("0000000\0", 108);
  put("0000000\0", 116);
  put(`${size.toString(8).padStart(11, "0")}\0`, 124);
  put("00000000000\0", 136);
  put("        ", 148);
  put(type, 156);
  put("ustar\0", 257);
  put("00", 263);
  const sum = block.reduce((total, byte) => total + byte, 0);
  put(`${sum.toString(8).padStart(6, "0")}\0 `, 148);
  return block;
}

/** A body padded to whole blocks. */
const padded = (bytes: Uint8Array): Uint8Array => {
  const out = new Uint8Array(Math.ceil(bytes.length / BLOCK) * BLOCK);
  out.set(bytes);
  return out;
};

/**
 * A gzipped npm tarball of `files` (paths relative to `package/`).
 *
 * @example
 * makeTarball({ "package.json": JSON.stringify({ name: "@stackra/core", version: "1.0.0" }) });
 */
export function makeTarball(files: Readonly<Record<string, string>>): Uint8Array<ArrayBuffer> {
  const parts: Uint8Array[] = [];
  for (const [path, text] of Object.entries(files)) {
    const name = `package/${path}`;
    const body = new TextEncoder().encode(text);
    if (name.length > 100) {
      const record = ` path=${name}\n`;
      let line = `${record.length}${record}`;
      line = `${line.length}${record}`;
      const pax = new TextEncoder().encode(line);
      parts.push(header("PaxHeader", pax.length, "x"), padded(pax));
    }
    parts.push(header(name, body.length, "0"), padded(body));
  }
  parts.push(new Uint8Array(BLOCK * 2));
  return new Uint8Array(gzipSync(Buffer.concat(parts)));
}
