/**
 * Stackra file contract:
 * Purpose: proves `fileNamePartsOf` and `isolatedFileNameOf` cut an Arabic name, a Latin name and a name with no
 *          extension into base, extension and direction, and isolate the parts without reversing a character.
 * Boundary: pure functions; no rendering.
 * Runtime: node
 * Governing contract: ADR 0060 (right-to-left); ADR 0022 (test placement); STA-1371 (wave C).
 */
import { fileNamePartsOf } from "#core/functions/file-name-parts-of.function";
import { isolatedFileNameOf } from "#core/functions/isolated-file-name-of.function";

/** The isolate marks, spelled out: left-to-right, right-to-left and first-strong isolates, and the pop. */
const [LRI, RLI, FSI, PDI] = ["\u{2066}", "\u{2067}", "\u{2068}", "\u{2069}"];

describe("fileNamePartsOf", () => {
  it("keeps an Arabic base right to left with its extension apart", () => {
    expect(fileNamePartsOf("فاتورة-1042.pdf")).toEqual({
      base: "فاتورة-1042",
      extension: ".pdf",
      direction: "rtl",
    });
  });

  it("reads a Latin name left to right", () => {
    expect(fileNamePartsOf("stock-october.xlsx")).toEqual({
      base: "stock-october",
      extension: ".xlsx",
      direction: "ltr",
    });
  });

  it("finds no extension in a name without one, a dotfile or a number", () => {
    expect(fileNamePartsOf("README")).toEqual({ base: "README", extension: "", direction: "ltr" });
    expect(fileNamePartsOf(".env").extension).toBe("");
    expect(fileNamePartsOf("تقرير 1.5").extension).toBe("");
    expect(fileNamePartsOf("مسودة")).toEqual({ base: "مسودة", extension: "", direction: "rtl" });
  });
});

describe("isolatedFileNameOf", () => {
  it("wraps the base in FSI…PDI and the extension in LRI…PDI inside an isolate of the base's direction", () => {
    expect(isolatedFileNameOf("فاتورة-1042.pdf")).toBe(
      `${RLI}${FSI}فاتورة-1042${PDI}${LRI}.pdf${PDI}${PDI}`,
    );
    expect(isolatedFileNameOf("stock-october.xlsx")).toBe(
      `${LRI}${FSI}stock-october${PDI}${LRI}.xlsx${PDI}${PDI}`,
    );
    expect(isolatedFileNameOf("README")).toBe(`${LRI}${FSI}README${PDI}${PDI}`);
  });

  it("only adds invisible marks: stripped, the name is unchanged", () => {
    const name = "مخزون-أكتوبر.xlsx";
    expect(isolatedFileNameOf(name).replaceAll(/[\u{2066}-\u{2069}]/gu, "")).toBe(name);
  });
});
