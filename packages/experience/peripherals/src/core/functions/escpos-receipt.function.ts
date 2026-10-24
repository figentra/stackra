/**
 * Stackra file contract:
 * Purpose: `escposReceipt`, the ESC/POS bytes of a receipt's lines: initialise the printer, print each line, feed the
 *          paper past the cutter and make a partial cut. Any ESC/POS printer (the POS kit's preset) takes them over
 *          TCP, a device path or USB.
 * Boundary: internal; pure. Lines are text only: every character outside printable ASCII becomes `?`, so control bytes
 *           in a line can never reach the printer as a command (a drawer kick, a cut).
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4: the ESC/POS receipt printer).
 */

/** ESC, GS and line feed. */
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

/** `?`, printed for a character the printer's default code page cannot show. */
const UNPRINTABLE = 0x3f;

/**
 * The bytes that print `lines` and cut the paper.
 *
 * @example
 * escposReceipt(["Total 12.00"]); // ESC @, the line and LF, a 4-line feed, a partial cut
 */
export function escposReceipt(lines: readonly string[]): Uint8Array {
  const bytes: number[] = [ESC, 0x40];
  for (const line of lines) {
    // shortcut: printable ASCII only (code page 437's common range); Arabic and other scripts need a raster image or
    // a code-page table, added when a preset prints them.
    for (const character of line) {
      const code = character.codePointAt(0) ?? UNPRINTABLE;
      bytes.push(code >= 0x20 && code <= 0x7e ? code : UNPRINTABLE);
    }
    bytes.push(LF);
  }
  bytes.push(ESC, 0x64, 4, GS, 0x56, 0x01);
  return Uint8Array.from(bytes);
}
