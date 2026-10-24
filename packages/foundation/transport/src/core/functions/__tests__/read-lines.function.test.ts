/**
 * Stackra file contract:
 * Purpose: unit tests of `readLines`: lines split on CRLF, LF and CR also across chunk boundaries (a CRLF split in two
 *          and a character split mid-byte), the unterminated last line kept, a body without a stream read whole, and
 *          the stream cancelled when the consumer stops early.
 * Boundary: test only; bodies are hand-built `ReadableStream`s of encoded chunks.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { readLines } from "#core/functions/read-lines.function";

/** A response whose body streams `chunks` in order. */
function streamed(...chunks: (string | Uint8Array)[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks)
          controller.enqueue(typeof chunk === "string" ? encoder.encode(chunk) : chunk);
        controller.close();
      },
    }),
  );
}

/** Every line `readLines` yields. */
async function lines(response: Response): Promise<string[]> {
  const all: string[] = [];
  for await (const line of readLines(response)) all.push(line);
  return all;
}

describe("readLines", () => {
  it("splits on CRLF, LF and CR", async () => {
    expect(await lines(streamed("a\r\nb\nc\rd\n"))).toEqual(["a", "b", "c", "d"]);
  });

  it("joins a line and a CRLF split across chunks", async () => {
    expect(await lines(streamed("al", "pha\r", "\nbeta\r", "gamma\n"))).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
  });

  it("decodes a character split across chunks", async () => {
    const bytes = new TextEncoder().encode("café\n");
    expect(await lines(streamed(bytes.slice(0, 4), bytes.slice(4)))).toEqual(["café"]);
  });

  it("keeps the last line without a final break, and an empty line in between", async () => {
    expect(await lines(streamed("one\n\ntwo"))).toEqual(["one", "", "two"]);
  });

  it("reads a body without a stream whole", async () => {
    const response = { body: null, text: async () => "x\ny\r" } as unknown as Response;
    expect(await lines(response)).toEqual(["x", "y"]);
  });

  it("cancels the stream when the consumer stops early", async () => {
    const cancel = vi.fn();
    const encoder = new TextEncoder();
    const response = new Response(
      new ReadableStream<Uint8Array>({
        pull(controller) {
          controller.enqueue(encoder.encode("tick\n"));
        },
        cancel,
      }),
    );
    for await (const line of readLines(response)) {
      expect(line).toBe("tick");
      break;
    }
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
