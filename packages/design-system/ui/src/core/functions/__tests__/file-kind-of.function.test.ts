/**
 * Stackra file contract:
 * Purpose: proves `fileKindOf` picks the type mark from the MIME type, then the extension, falls back to the plain
 *          file icon, and writes the extension in upper case.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
import { fileKindOf } from "#core/functions/file-kind-of.function";

describe("fileKindOf", () => {
  it.each([
    ["invoice-1042.pdf", undefined, "file-text", "PDF"],
    ["stock.csv", "text/csv", "file-spreadsheet", "CSV"],
    ["photo", "image/jpeg", "file-image", ""],
    ["backup.ZIP", undefined, "file-archive", "ZIP"],
    ["clip.mov", undefined, "file-video-camera", "MOV"],
    ["notes.bin", "application/octet-stream", "file", "BIN"],
  ] as const)("reads %j (%j) as %j %j", (name, type, icon, extension) => {
    expect(fileKindOf(name, type)).toEqual({ icon, extension });
  });
});
