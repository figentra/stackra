/**
 * Stackra file contract:
 * Purpose: `checkAdrNumbers(adrFiles, numbersText)`, the ADR number register (STA-1732): every
 *          `apps/docs/src/docs/adr/NNNN-<slug>.mdx` has its number in `numbers.yaml` with the same slug, and no number is
 *          used twice, by two files or by two entries.
 * Boundary: pure; `numbersText` is `apps/docs/adr/numbers.yaml`, undefined when absent. A repository without
 *           the register (a product that keeps no ADRs here) is not checked.
 * Runtime: node
 * Governing contract: ADR template (apps/docs/src/docs/adr/template.mdx); STA-1732.
 */
import { parse } from "yaml";

/** An ADR page: four digits, a dash, the slug. */
const ADR_FILE = /^apps\/docs\/src\/docs\/adr\/(\d{4})-(.+)\.mdx$/;

/**
 * The ADR number findings.
 *
 * @param adrFiles - repository paths; those that are not ADR pages are ignored.
 * @param numbersText - the register, or undefined when there is none (then nothing is checked).
 * @example
 * checkAdrNumbers(["apps/docs/src/docs/adr/0001-a.mdx"], '"0001":\n  slug: a\n'); // []
 */
export function checkAdrNumbers(
  adrFiles: readonly string[],
  numbersText: string | undefined,
): string[] {
  const pages = adrFiles.flatMap((path) => {
    const match = ADR_FILE.exec(path);
    return match ? [{ path, number: match[1] ?? "", slug: match[2] ?? "" }] : [];
  });
  if (pages.length === 0 || numbersText === undefined) return [];
  let register: Record<string, { slug?: string } | null>;
  try {
    // A repeated key (a number registered twice) throws here.
    register = (parse(numbersText, { uniqueKeys: true }) ?? {}) as typeof register;
  } catch (error) {
    return [`apps/docs/adr/numbers.yaml: ${(error as Error).message.split("\n")[0]}`];
  }
  const slugs = new Map(
    Object.entries(register).map(([key, entry]) => [key.padStart(4, "0"), entry?.slug]),
  );
  const findings: string[] = [];
  const seen = new Map<string, string>();
  for (const { path, number, slug } of pages) {
    const other = seen.get(number);
    if (other !== undefined)
      findings.push(`${path}: ADR number ${number} is also used by ${other}`);
    seen.set(number, path);
    if (!slugs.has(number)) {
      findings.push(`${path}: ADR number ${number} is not in numbers.yaml (pnpm adr:reserve)`);
    } else if (slugs.get(number) !== slug) {
      findings.push(
        `${path}: numbers.yaml registers ${number} as "${slugs.get(number)}", not "${slug}"`,
      );
    }
  }
  return findings;
}
