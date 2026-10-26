/**
 * Stackra file contract:
 * Purpose: unit tests of `byteChunks`: a `ReadableStream` and an async iterable yield their chunks in order, strings
 *          as UTF-8 and empty chunks skipped, and the stream's lock is released afterwards.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0413.
 */
import { describe, expect, it } from "@stackra/testing";

import { byteChunks } from "#contracts/functions/byte-chunks.function";

/** Every chunk `source` yields. */
async function drain(source: Parameters<typeof byteChunks>[0]): Promise<Uint8Array[]> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of byteChunks(source)) chunks.push(chunk);
  return chunks;
}

describe("byteChunks", () => {
  it("reads a ReadableStream in order and releases its lock", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array());
        controller.enqueue(new Uint8Array([3]));
        controller.close();
      },
    });
    expect(await drain(stream)).toEqual([new Uint8Array([1, 2]), new Uint8Array([3])]);
    expect(stream.locked).toBe(false);
  });

  it("encodes the strings of an async iterable as UTF-8", async () => {
    const chunks = await drain(rows());
    expect(chunks.map((chunk) => new TextDecoder().decode(chunk))).toEqual(["id,name\n", "a"]);
  });
});

/**
 * CSV rows as strings, an empty string and bytes.
 *
 * @yields each chunk in turn.
 */
async function* rows() {
  yield "id,name\n";
  yield "";
  yield new Uint8Array([0x61]);
}
