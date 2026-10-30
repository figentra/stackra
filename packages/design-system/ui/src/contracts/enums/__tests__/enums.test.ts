/**
 * Stackra file contract:
 * Purpose: proves every enum in `contracts/enums` is one frozen, non-empty tuple of unique, non-empty strings or
 *          numbers (`HourCycle`, `HeadingLevel`), so a
 *          picker or a schema built from it never shows a blank or doubled choice and nothing can push to it.
 * Boundary: loads each enum file of the folder; no other module.
 * Runtime: node
 * Governing contract: ADR 0128 (enums as frozen tuples); ADR 0022 (test placement); STA-1371.
 */
import { readdirSync } from "node:fs";

const FOLDER = new URL("../", import.meta.url);
const FILES = readdirSync(FOLDER).filter((name) => name.endsWith(".enum.ts"));

describe("contracts enums", () => {
  it("finds the enum files", () => {
    expect(FILES.length).toBeGreaterThan(50);
  });

  it.each(FILES)("%s exports one frozen tuple of unique values", async (file) => {
    const module = (await import(new URL(file, FOLDER).href)) as Record<string, unknown>;
    const values = Object.values(module);
    expect(values).toHaveLength(1);
    const [tuple] = values;
    expect(Array.isArray(tuple)).toBe(true);
    expect(Object.isFrozen(tuple)).toBe(true);
    const items = tuple as readonly unknown[];
    expect(items.length).toBeGreaterThan(0);
    expect(
      items.every((item) => (typeof item === "string" && item !== "") || Number.isFinite(item)),
    ).toBe(true);
    expect(new Set(items).size).toBe(items.length);
  });
});
