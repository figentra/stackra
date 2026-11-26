/**
 * Stackra file contract:
 * Purpose: `loadAcceptedBreaks(text, today)`, the accepted-breaks file checked: the well-formed entries (each marked
 *          `expired` or not against `today`) and a problem line for every other entry. An entry needs `member`,
 *          `operation` (`<METHOD> <path>`), `id` (the `oasdiff` rule), an issue key, a `reason`, and `expires` 0 to
 *          `MAX_ACCEPTED_BREAK_DAYS` days after `added`, which is not in the future.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: `oasdiff` contract checks); STA-2837.
 */
import { parse } from "yaml";

import { MAX_ACCEPTED_BREAK_DAYS } from "#node/contract/constants/max-accepted-break-days.constant";
import type { AcceptedBreakList } from "#node/contract/types/accepted-break-list.type";
import type { AcceptedBreak } from "#node/contract/types/accepted-break.type";

/** One day in milliseconds. */
const DAY_MS = 86_400_000;

/** A calendar date. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** An issue key (`STA-2837`, `ACA-12`). */
const ISSUE_KEY = /^[A-Z][A-Z0-9]*-\d+$/;

/** An operation as the projection spells it: upper-case method, a space, a path from the root. */
const OPERATION = /^[A-Z]+ \/\S*$/;

/**
 * Parses and checks the accepted breaks.
 *
 * @param text - the YAML of `tools/contract/accepted-breaks.yaml` ("" when the file is missing).
 * @param today - the run date, `YYYY-MM-DD`.
 * @throws Error when `today` is not a date or `accepted` is not a list.
 * @example
 * loadAcceptedBreaks("accepted: []\n", "2026-11-26"); // { entries: [], problems: [] }
 */
export function loadAcceptedBreaks(text: string, today: string): AcceptedBreakList {
  if (!ISO_DATE.test(today))
    throw new Error(`accepted breaks: today must be YYYY-MM-DD, got ${today}`);
  const raw = (parse(text) as { accepted?: unknown } | null)?.accepted ?? [];
  if (!Array.isArray(raw)) throw new Error("accepted breaks: `accepted` must be a list");
  const entries: AcceptedBreak[] = [];
  const problems: string[] = [];
  (raw as unknown[]).forEach((value, index) => {
    const at = `accepted[${index}]`;
    const item = (typeof value === "object" && value !== null ? value : {}) as Record<
      string,
      unknown
    >;
    const field = (name: string): string =>
      typeof item[name] === "string" ? (item[name] as string).trim() : "";
    const [member, operation, id, issue, reason, added, expires] = [
      "member",
      "operation",
      "id",
      "issue",
      "reason",
      "added",
      "expires",
    ].map(field) as [string, string, string, string, string, string, string];
    const days = (Date.parse(expires) - Date.parse(added)) / DAY_MS;
    if (!member || !id || !reason) problems.push(`${at}: member, id and reason are required`);
    else if (!OPERATION.test(operation))
      problems.push(`${at}: operation must be \`<METHOD> <path>\`, such as \`POST /invoices\``);
    else if (!ISSUE_KEY.test(issue)) problems.push(`${at}: issue must be an issue key (STA-n)`);
    else if (!ISO_DATE.test(added) || !ISO_DATE.test(expires))
      problems.push(`${at}: added and expires must be YYYY-MM-DD`);
    else if (added > today) problems.push(`${at}: added ${added} is in the future`);
    else if (!(days >= 0 && days <= MAX_ACCEPTED_BREAK_DAYS))
      problems.push(
        `${at}: expires must be 0 to ${MAX_ACCEPTED_BREAK_DAYS} days after added (an accepted break is for one change)`,
      );
    else
      entries.push({
        member,
        operation,
        id,
        issue,
        reason,
        added,
        expires,
        expired: expires < today,
      });
  });
  return { entries, problems };
}
