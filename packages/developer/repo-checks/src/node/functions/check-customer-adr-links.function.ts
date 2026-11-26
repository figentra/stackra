/**
 * Stackra file contract:
 * Purpose: `checkCustomerAdrLinks(files)`, buyer-facing citations (STA-2851): a customer page
 *          (`apps/docs/src/docs/customers/**.mdx`) states rules in force, so every ADR it links is a page that exists
 *          and is neither superseded nor rejected.
 * Boundary: pure; `files` are repository files and their texts: the ADR pages give each ADR's status, the customer
 *           pages are checked, every other file is ignored. Links are Markdown links to `/adr/NNNN-<slug>`; a bare
 *           "ADR NNNN" in a file contract is history, not a citation, and is not read.
 * Runtime: node
 * Governing contract: ADR template (apps/docs/src/docs/adr/template.mdx, status vocabulary); STA-2851.
 */
import { ADR_PAGE_PATH } from "#node/constants/adr-page-path.constant";
import { adrStatusOf } from "#node/functions/adr-status-of.function";
import { descriptionOf } from "#node/functions/description-of.function";
import type { AdrStatus } from "#node/types/adr-status.type";
import type { TextFile } from "#node/types/text-file.type";

/** A customer page. */
const CUSTOMER_PAGE = /^apps\/docs\/src\/docs\/customers\/.+\.mdx$/;

/** A Markdown link to an ADR page: `](/adr/NNNN-slug)`, with an optional `#anchor`. */
const ADR_LINK = /\]\(\/adr\/(\d{4}-[^)\s#]+)/g;

/** Statuses a customer page may not cite: the decision is not in force and not planned. */
const NOT_IN_FORCE: ReadonlySet<string> = new Set(["superseded", "rejected"]);

/**
 * The customer-page ADR link findings.
 *
 * @param files - repository files and their texts (ADR pages and customer pages; others are ignored).
 * @example
 * checkCustomerAdrLinks([
 *   { path: "apps/docs/src/docs/adr/0013-x.mdx", text: '---\ndescription: "Superseded by 0025"\n---\n' },
 *   { path: "apps/docs/src/docs/customers/support.mdx", text: "See [0013](/adr/0013-x).\n" },
 * ]); // ["apps/docs/src/docs/customers/support.mdx:1: links ADR 0013, which is superseded by 0025; ..."]
 */
export function checkCustomerAdrLinks(files: readonly TextFile[]): string[] {
  const statuses = new Map<string, AdrStatus | undefined>(
    files.flatMap(({ path, text }): [string, AdrStatus | undefined][] => {
      const match = ADR_PAGE_PATH.exec(path);
      if (!match) return [];
      return [[`${match[1]}-${match[2]}`, adrStatusOf(descriptionOf(text) ?? "")]];
    }),
  );
  return files
    .filter(({ path }) => CUSTOMER_PAGE.test(path))
    .flatMap(({ path, text }) =>
      text.split("\n").flatMap((line, at) =>
        [...line.matchAll(ADR_LINK)].flatMap((match) => {
          const target = match[1] ?? "";
          const where = `${path}:${at + 1}`;
          if (!statuses.has(target))
            return [`${where}: links /adr/${target}, which is no ADR page`];
          const status = statuses.get(target);
          if (status === undefined || !NOT_IN_FORCE.has(status.status)) return [];
          const by = status.by === undefined ? "" : ` by ${status.by}`;
          return [
            `${where}: links ADR ${target.slice(0, 4)}, which is ${status.status}${by}; a customer page cites only decisions in force`,
          ];
        }),
      ),
    );
}
