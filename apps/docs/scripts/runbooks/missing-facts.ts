/**
 * Stackra file contract:
 * Purpose: `missingFacts`, the phrases a runbook must state and does not, so the incident, on-call, postmortem and
 *          recovery runbooks cannot drift from the numbers of ADRs 0170, 0185 and 0186.
 * Boundary: pure: text and phrases in, the missing phrases out; which page needs which phrase is the test's
 *           (`__tests__/runbooks.test.ts`).
 * Runtime: node
 * Governing contract: ADR 0185 (decisions 1 and 2); ADR 0186 (decisions 1, 2, 5 and 6); ADR 0170 (decision 8); STA-27.
 */

const WHITESPACE = /\s+/g;

/** `text` lower-cased with every run of whitespace (line wraps, MDX indentation) folded to one space. */
function normalise(text: string): string {
  return text.toLowerCase().replaceAll(WHITESPACE, " ");
}

/**
 * The phrases of `facts` that `text` does not state, compared without case and across line wraps.
 *
 * @param text - the page source (MDX).
 * @param facts - the phrases the page must contain.
 */
export function missingFacts(text: string, facts: readonly string[]): string[] {
  const page = normalise(text);
  return facts.filter((fact) => !page.includes(normalise(fact)));
}
