/**
 * Stackra file contract:
 * Purpose: unit tests of `readZip`: a deflated and a stored entry from `writeZip` read back byte for byte, a missing
 *          name is `undefined`; and the refusals of an untrusted archive (STA-1736): bytes that are not a zip, more
 *          entries than the ceiling, an absolute or climbing entry name, an entry inflating past its ratio (a zip
 *          bomb), and parts inflating past the file's total.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decisions 2 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import type { ZipEntry } from "#core/types/zip-entry.type";
import { UnreadableWorkbookError } from "#core/errors/unreadable-workbook.error";
import { writeZip } from "#core/functions/write-zip.function";
import { XLSX_CEILINGS } from "#node/constants/xlsx-ceilings.constant";
import { readZip } from "#node/functions/read-zip.function";

/** `entries` zipped. */
async function zipOf(entries: readonly ZipEntry[]): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of writeZip(entries, new Date(Date.UTC(2026, 9, 25)))) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/** The reason `run` refuses with. */
function reasonOf(run: () => unknown): string | undefined {
  try {
    run();
  } catch (error) {
    if (error instanceof UnreadableWorkbookError) return error.reason;
    throw error;
  }
  return undefined;
}

const encoder = new TextEncoder();

describe("readZip", () => {
  it("reads deflated and stored entries, and nothing for a missing name", async () => {
    const file = readZip(
      await zipOf([
        {
          name: "a/مرحبا.txt",
          bytes: [encoder.encode("hello "), encoder.encode("world".repeat(50))],
        },
        { name: "b.bin", bytes: [new Uint8Array([1, 2, 3])], method: "store" },
      ]),
      XLSX_CEILINGS,
    );
    expect(new TextDecoder().decode(file("a/مرحبا.txt"))).toBe(`hello ${"world".repeat(50)}`);
    expect([...(file("b.bin") ?? [])]).toEqual([1, 2, 3]);
    expect(file("c.txt")).toBeUndefined();
  });

  it("refuses bytes that are not a zip", () => {
    expect(
      reasonOf(() => readZip(encoder.encode("not a zip at all, just text"), XLSX_CEILINGS)),
    ).toBe("not_a_zip");
  });

  it("refuses more entries than the ceiling", async () => {
    const bytes = await zipOf(
      ["a", "b", "c"].map((name) => ({ name, bytes: [encoder.encode(name)] })),
    );
    expect(reasonOf(() => readZip(bytes, { ...XLSX_CEILINGS, entries: 2 }))).toBe(
      "too_many_entries",
    );
    expect(reasonOf(() => readZip(bytes, { ...XLSX_CEILINGS, entries: 3 }))).toBeUndefined();
  });

  it.each(["../evil.xml", "xl/../../evil.xml", "/etc/passwd", "xl\\evil.xml", "C:evil.xml"])(
    "refuses the path-traversal entry name %s",
    async (name) => {
      const bytes = await zipOf([{ name, bytes: [encoder.encode("x")] }]);
      expect(reasonOf(() => readZip(bytes, XLSX_CEILINGS))).toBe("unsafe_entry_name");
    },
  );

  it("refuses an entry that inflates past its ratio (a zip bomb) without inflating it all", async () => {
    const bomb = await zipOf([
      { name: "xl/sharedStrings.xml", bytes: [new Uint8Array(16 * 1024 * 1024)] },
    ]);
    expect(bomb.length).toBeLessThan(100_000);
    const file = readZip(bomb, XLSX_CEILINGS);
    expect(reasonOf(() => file("xl/sharedStrings.xml"))).toBe("compression_ratio");
  });

  it("refuses parts that inflate past the file's total", async () => {
    const part = { bytes: [encoder.encode("x".repeat(4096))] };
    const file = readZip(
      await zipOf([
        { name: "a", ...part },
        { name: "b", ...part },
      ]),
      {
        ...XLSX_CEILINGS,
        totalBytes: 6000,
      },
    );
    expect(file("a")?.length).toBe(4096);
    expect(reasonOf(() => file("b"))).toBe("too_large");
  });
});
