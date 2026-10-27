/**
 * Stackra file contract:
 * Purpose: unit tests of `readTarball`: regular files with `package/` removed, the ustar prefix and pax long names,
 *          directories skipped, and a path that climbs out refused.
 * Boundary: test only; builds tarballs in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 11).
 */
import { gzipSync } from "node:zlib";

import { describe, expect, it } from "@stackra/testing";

import { readTarball } from "#node/functions/read-tarball.function";

const encoder = new TextEncoder();

/** One ustar entry: a header block and its body padded to 512 bytes. */
const entry = (name: string, body: string, type = "0", prefix = "") => {
  const header = new Uint8Array(512);
  header.set(encoder.encode(name), 0);
  header.set(encoder.encode(`${body.length.toString(8).padStart(11, "0")}\0`), 124);
  header.set(encoder.encode(type), 156);
  header.set(encoder.encode("ustar\0"), 257);
  header.set(encoder.encode(prefix), 345);
  const data = new Uint8Array(Math.ceil(body.length / 512) * 512);
  data.set(encoder.encode(body));
  return [header, data];
};
const tgz = (...entries: Uint8Array[][]) =>
  gzipSync(Buffer.concat([...entries.flat(), new Uint8Array(1024)]));
const text = (files: Map<string, Uint8Array>, path: string) =>
  new TextDecoder().decode(files.get(path));

describe("readTarball", () => {
  it("reads regular files without npm's package/ folder and skips directories", () => {
    const files = readTarball(
      tgz(
        entry("package/", "", "5"),
        entry("package/SKILL.md", "# Archify"),
        entry("package/references/a.md", "a"),
      ),
    );
    expect([...files.keys()]).toEqual(["SKILL.md", "references/a.md"]);
    expect(text(files, "SKILL.md")).toBe("# Archify");
  });

  it("joins the ustar prefix and reads a pax long name", () => {
    const long = `package/${"deep/".repeat(30)}file.md`;
    const pax = `${long.length + 7 + String(long.length).length} path=${long}\n`;
    const files = readTarball(
      tgz(
        entry("x.md", "one", "0", "package/docs"),
        entry("PaxHeader", pax, "x"),
        entry("package/truncated", "two"),
      ),
    );
    expect(text(files, "docs/x.md")).toBe("one");
    expect(text(files, long.slice("package/".length))).toBe("two");
  });

  it("refuses a path that climbs out of the folder", () => {
    expect(() => readTarball(tgz(entry("package/../escape.md", "x")))).toThrow(
      /outside its folder/,
    );
  });
});
