/**
 * Stackra file contract:
 * Purpose: `checkAdrIndex(files, indexText, numbersText)`, the ADR index and register health (STA-2851): every ADR page
 *          has exactly one row in `apps/docs/src/docs/adr/index.mdx`, linking that page and stating the page's status;
 *          no row names a number without a page; every page's description opens with a status; and the number
 *          register states the page's status, with a `reserved` or `external` entry having no page and every other
 *          entry having one.
 * Boundary: pure; `files` are repository files and their texts (only ADR pages are read), `indexText` the index or
 *           undefined when absent, `numbersText` the register or undefined when absent (then the register is not
 *           compared). A repository without ADR pages is not checked. A page missing from the register, a slug that
 *           differs from it and a broken register are `checkAdrNumbers`' findings, not repeated here.
 * Runtime: node
 * Governing contract: ADR template (apps/docs/src/docs/adr/template.mdx); STA-1732; STA-2851.
 */
import { parse } from "yaml";

import { ADR_INDEX_PATH } from "#node/constants/adr-index-path.constant";
import { ADR_PAGE_PATH } from "#node/constants/adr-page-path.constant";
import { adrStatusOf } from "#node/functions/adr-status-of.function";
import { descriptionOf } from "#node/functions/description-of.function";
import type { AdrStatus } from "#node/types/adr-status.type";
import type { TextFile } from "#node/types/text-file.type";

/** The number register. */
const REGISTER_PATH = "apps/docs/adr/numbers.yaml";

/** The register's status vocabulary. */
const REGISTER_STATUSES = [
  "reserved",
  "external",
  "proposed",
  "accepted",
  "deferred",
  "rejected",
  "superseded",
] as const;

/** Register statuses whose number has no page in this repository. */
const PAGELESS: ReadonlySet<string> = new Set(["reserved", "external"]);

/** An index row that links an ADR: `| [NNNN](/adr/<target>) | decision | status |`. */
const INDEX_ROW = /^\|\s*\[(\d{4})\]\(\/adr\/([^)\s#]+)\)\s*\|/;

/** A table cell separator: a pipe not escaped with a backslash. */
const CELL_SEPARATOR = /(?<!\\)\|/;

/** A status as a reader writes it: `accepted`, `superseded by 0510`. */
const label = (status: AdrStatus): string =>
  status.by === undefined ? status.status : `${status.status} by ${status.by}`;

/** Two statuses agree when the words match and, when both name a superseding ADR, the numbers do too. */
const agree = (a: AdrStatus, b: AdrStatus): boolean =>
  a.status === b.status && (a.by === undefined || b.by === undefined || a.by === b.by);

/**
 * The ADR index and register findings.
 *
 * @param files - repository files and their texts; those that are not ADR pages are ignored.
 * @param indexText - `apps/docs/src/docs/adr/index.mdx`, or undefined when it is missing.
 * @param numbersText - `apps/docs/adr/numbers.yaml`, or undefined when the repository keeps no register.
 * @example
 * checkAdrIndex(
 *   [{ path: "apps/docs/src/docs/adr/0001-a.mdx", text: '---\ndescription: "Accepted · 2026-10-19"\n---\n' }],
 *   "| [0001](/adr/0001-a) | A | Accepted |\n",
 *   '"0001":\n  slug: a\n  status: accepted\n',
 * ); // []
 */
export function checkAdrIndex(
  files: readonly TextFile[],
  indexText: string | undefined,
  numbersText: string | undefined,
): string[] {
  const pages = files.flatMap(({ path, text }) => {
    const match = ADR_PAGE_PATH.exec(path);
    if (!match) return [];
    const stated = descriptionOf(text);
    const status = stated === undefined ? undefined : adrStatusOf(stated);
    return [{ path, number: match[1] ?? "", target: `${match[1]}-${match[2]}`, status }];
  });
  if (pages.length === 0) return [];
  const byNumber = new Map(pages.map((page) => [page.number, page]));
  const findings: string[] = [];
  for (const page of pages) {
    if (page.status === undefined) {
      findings.push(
        `${page.path}: the description does not open with a status (Accepted, Proposed, Deferred, Rejected or Superseded by NNNN; ADR template)`,
      );
    }
  }

  if (indexText === undefined) {
    findings.push(`${ADR_INDEX_PATH}: missing; every ADR page needs a row there (ADR template)`);
  } else {
    const indexed = new Set<string>();
    indexText.split("\n").forEach((line, at) => {
      const match = INDEX_ROW.exec(line);
      if (!match) return;
      const number = match[1] ?? "";
      const where = `${ADR_INDEX_PATH}:${at + 1}`;
      if (indexed.has(number)) {
        findings.push(`${where}: a second row for ADR ${number}`);
        return;
      }
      indexed.add(number);
      const page = byNumber.get(number);
      if (page === undefined) {
        findings.push(`${where}: the row for ADR ${number} has no page`);
        return;
      }
      if (match[2] !== page.target) {
        findings.push(
          `${where}: the row links /adr/${match[2]}, but the page is /adr/${page.target}`,
        );
      }
      const cells = line.split(CELL_SEPARATOR);
      const cell = (cells.at(-2) ?? "").trim();
      const stated = adrStatusOf(cell);
      if (page.status !== undefined && (stated === undefined || !agree(stated, page.status))) {
        findings.push(
          `${where}: the row for ADR ${number} says "${cell}", but the page says ${label(page.status)}`,
        );
      }
    });
    for (const page of pages) {
      if (!indexed.has(page.number)) {
        findings.push(`${page.path}: no row in ${ADR_INDEX_PATH} (ADR template)`);
      }
    }
  }

  if (numbersText === undefined) return findings;
  let register: Record<string, { slug?: unknown; status?: unknown } | null>;
  try {
    register = (parse(numbersText, { uniqueKeys: true }) ?? {}) as typeof register;
  } catch {
    // `checkAdrNumbers` reports a register that does not parse.
    return findings;
  }
  for (const [key, entry] of Object.entries(register)) {
    const number = key.padStart(4, "0");
    const status = String(entry?.status ?? "");
    const page = byNumber.get(number);
    if (!(REGISTER_STATUSES as readonly string[]).includes(status)) {
      findings.push(
        `${REGISTER_PATH}: ${number} has status "${status}"; use one of ${REGISTER_STATUSES.join(", ")}`,
      );
    } else if (PAGELESS.has(status)) {
      if (page !== undefined) {
        const now = page.status === undefined ? "its page's status" : page.status.status;
        findings.push(
          `${REGISTER_PATH}: ${number} is ${status}, but ${page.path} exists; set status: ${now}`,
        );
      }
    } else if (page === undefined) {
      findings.push(
        `${REGISTER_PATH}: ${number} is ${status}, but there is no page apps/docs/src/docs/adr/${number}-${String(entry?.slug ?? "")}.mdx`,
      );
    } else if (page.status !== undefined && page.status.status !== status) {
      findings.push(
        `${REGISTER_PATH}: ${number} is ${status}, but ${page.path} says ${label(page.status)}`,
      );
    }
  }
  return findings;
}
