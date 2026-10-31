/**
 * Stackra file contract:
 * Purpose: `mockTamoContinue`, the offline mock's "Continue writing": one closing sentence in the text's language.
 * Boundary: demo only: no model, the same output for the same input every time.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (a deterministic mock provider for the playground).
 */
/** Arabic letters. */
const ARABIC = /[\u0600-\u06FF]/u;

/** What comes after the text. */
export function mockTamoContinue(text: string): string {
  const space = /\s$/u.test(text) || text === "" ? "" : " ";
  return ARABIC.test(text)
    ? `${space}وسنبقيك على اطلاع في كل خطوة.`
    : `${space}We will keep you posted at every step.`;
}
