/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `FileSystem`, which the template's desktop wiring imports
 *          (`deps: [FileSystem]`, `port: FileSystem`), and `EncoreBucket` are exported, nothing else is a value, and
 *          the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { FileStat, WriteOptions, WriteStreamSource } from "#contracts/index";

describe("@stackra/filesystem/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["EncoreBucket", "FileSystem"]);
  });

  it("resolves its public types", () => {
    expectTypeOf<FileStat["lastModified"]>().toEqualTypeOf<Date | null>();
    expectTypeOf<FileStat["contentType"]>().toEqualTypeOf<string | null>();
    expectTypeOf<WriteOptions["contentType"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<WriteStreamSource>().toEqualTypeOf<
      ReadableStream<Uint8Array> | AsyncIterable<Uint8Array | string>
    >();
  });
});
