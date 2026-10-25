/**
 * Stackra file contract:
 * Purpose: unit tests of `readNdjson`: one value per line as the chunks arrive, blank lines skipped, the last line
 *          read without a final break, and a line that is not JSON thrown as `SyntaxError` with the body cancelled.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { readNdjson } from "#core/functions/read-ndjson.function";

/** A response whose body streams `chunks` in order, calling `cancel` if it is cancelled. */
function streamed(chunks: string[], cancel?: () => void): Response {
  const encoder = new TextEncoder();
  let index = 0;
  return new Response(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        const chunk = chunks[index++];
        if (chunk === undefined) controller.close();
        else controller.enqueue(encoder.encode(chunk));
      },
      ...(cancel ? { cancel } : {}),
    }),
  );
}

describe("readNdjson", () => {
  it("yields each line's value, skipping blank lines", async () => {
    const values: unknown[] = [];
    for await (const value of readNdjson(streamed(['{"n":1}\n\n{"n"', ":2}\r\n  \n[3]"])))
      values.push(value);
    expect(values).toEqual([{ n: 1 }, { n: 2 }, [3]]);
  });

  it("throws SyntaxError on a line that is not JSON and cancels the body", async () => {
    const cancel = vi.fn();
    const values: unknown[] = [];
    const reading = (async () => {
      for await (const value of readNdjson(streamed(['{"n":1}\nnot json\n', '{"n":2}\n'], cancel)))
        values.push(value);
    })();
    await expect(reading).rejects.toThrow(SyntaxError);
    expect(values).toEqual([{ n: 1 }]);
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
