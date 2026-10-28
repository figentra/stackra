/**
 * Stackra file contract:
 * Purpose: unit tests of `PdfTableWriterDriver`: one sheet prints as an HTML table (headings, escaped and isolated
 *          cells, ISO dates) on the given page and yields the engine's bytes; two sheets and more than `maxRows` rows
 *          are refused.
 * Boundary: test only; the engine is a spy, so no Gotenberg runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 10).
 */
import { TransferLimitExceededError } from "@stackra/data-transfer";
import { TabularWriter } from "@stackra/data-transfer/contracts";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { PdfEngine } from "#contracts/ports/pdf-engine.port";
import { PdfTableWriterDriver } from "#core/drivers/pdf-table-writer.driver";

const PAGE = { widthMm: 297, heightMm: 210, marginMm: 10 };

/** The writer over a spy engine. */
function writerWith(maxRows = 10) {
  const engine = { print: vi.fn(async () => new Uint8Array([37, 80, 68, 70])) };
  return {
    engine,
    writer: new PdfTableWriterDriver(engine as unknown as PdfEngine, PAGE, maxRows),
  };
}

/** Every chunk `writer` yields for `rows`. */
async function drain(
  writer: PdfTableWriterDriver,
  rows: unknown[][],
  sheets = 1,
): Promise<Uint8Array[]> {
  const chunks: Uint8Array[] = [];
  const sheet = { name: "Orders", rows: rows as never };
  for await (const chunk of writer.write(Array.from({ length: sheets }, () => sheet)))
    chunks.push(chunk);
  return chunks;
}

describe("PdfTableWriterDriver", () => {
  it("is the pdf TabularWriter", () => {
    const { writer } = writerWith();
    expect(writer).toBeInstanceOf(TabularWriter);
    expect(writer.mediaType).toBe("application/pdf");
  });

  it("prints the sheet as an escaped table on the page and yields the engine's bytes", async () => {
    const { engine, writer } = writerWith();
    const chunks = await drain(writer, [
      ["number", "customer", "placedAt"],
      ["ORD-1", "<b>Ana</b>", new Date("2026-10-28T09:00:00Z")],
      ["ORD-2", "مها", null],
    ]);
    expect(chunks).toEqual([new Uint8Array([37, 80, 68, 70])]);
    const [html, page] = engine.print.mock.calls[0] as unknown as [string, unknown];
    expect(page).toBe(PAGE);
    expect(html).toContain('<th dir="auto">customer</th>');
    expect(html).toContain('<td dir="auto">&lt;b&gt;Ana&lt;/b&gt;</td>');
    expect(html).toContain('<td dir="auto">2026-10-28T09:00:00.000Z</td>');
    expect(html).toContain('<td dir="auto">مها</td><td dir="auto"></td>');
  });

  it("refuses two sheets and more rows than its cap", async () => {
    await expect(drain(writerWith().writer, [["a"]], 2)).rejects.toThrow(TypeError);
    await expect(drain(writerWith(1).writer, [["a"], ["1"], ["2"]])).rejects.toSatisfy(
      (error: unknown) => isRefusal(error, TransferLimitExceededError),
    );
  });
});
