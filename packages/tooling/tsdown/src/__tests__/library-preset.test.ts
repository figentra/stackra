/**
 * Proves `libraryPreset` is the same function as `library` and resolves the same config, and that
 * `LibraryPresetOptions` is the options type of both.
 */
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  library,
  libraryPreset,
  type LibraryOptions,
  type LibraryPresetOptions,
} from "../index.ts";

describe("@stackra/tsdown-config libraryPreset", () => {
  it("is the library function", () => {
    expect(libraryPreset).toBe(library);
  });

  it("resolves the same config as library for the same entries and options", () => {
    const entries = { index: ".stackra/entry/index.ts", node: ".stackra/entry/node.ts" };
    const options: LibraryPresetOptions = { external: ["react"] };

    expect(libraryPreset(entries, options)).toEqual(library(entries, options));
    expect(libraryPreset(entries)).toEqual(library(entries));
  });

  it("has the options type of library", () => {
    expectTypeOf<LibraryPresetOptions>().toEqualTypeOf<LibraryOptions>();
  });
});
