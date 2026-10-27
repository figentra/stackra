/**
 * Stackra file contract:
 * Purpose: unit tests of `parseCsv`: quoted cells with doubled quotes, delimiters and line breaks, CRLF, LF and CR
 *          line ends, blank lines, a last line with no line end, and chunk boundaries anywhere.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { parseCsv } from "#core/functions/parse-csv.function";

async function records(chunks: string[], delimiter = ","): Promise<string[][]> {
  const result: string[][] = [];
  const text = (async function* () {
    yield* chunks;
  })();
  for await (const record of parseCsv(text, delimiter)) result.push(record);
  return result;
}

describe("parseCsv", () => {
  it("parses quoted cells", async () => {
    expect(await records(['a,"b,""c""\nd",e\r\n', 'f,,""\n'])).toEqual([
      ["a", 'b,"c"\nd', "e"],
      ["f", "", ""],
    ]);
  });

  it("reads every line end and skips blank lines", async () => {
    expect(await records(["a\r\n\r\nb\rc\n\nd"])).toEqual([["a"], ["b"], ["c"], ["d"]]);
  });

  it("does not care where chunks split", async () => {
    const whole = 'الاسم;السعر\r\n"قلم; أزرق";5\r\n';
    expect(await records([...whole], ";")).toEqual(await records([whole], ";"));
    expect(await records([whole], ";")).toEqual([
      ["الاسم", "السعر"],
      ["قلم; أزرق", "5"],
    ]);
  });

  it("keeps stray quotes the way spreadsheet tools do", async () => {
    expect(await records(['a"b,"c"d\n'])).toEqual([['a"b', "cd"]]);
  });
});
