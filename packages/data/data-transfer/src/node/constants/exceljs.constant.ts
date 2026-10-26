/**
 * Stackra file contract:
 * Purpose: `EXCELJS`, the exceljs module as its typings describe it, loaded through `require` so the XLSX drivers get
 *          both working runtime values and checked types.
 * Boundary: node only and internal to `./node`. exceljs is CommonJS that assigns `module.exports` an object built at
 *           runtime, so Node's ESM loader finds no named exports, while its `index.d.ts` declares only named exports
 *           and no default, so `import ExcelJS from "exceljs"` does not typecheck. `createRequire` answers both.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2); STA-711 (the exceljs typings fix).
 */
import { createRequire } from "node:module";

/**
 * The exceljs module.
 *
 * @example
 * const reader = new EXCELJS.stream.xlsx.WorkbookReader(Readable.from(bytes), { worksheets: "emit" });
 */
export const EXCELJS = createRequire(import.meta.url)("exceljs") as typeof import("exceljs");
