/**
 * Stackra file contract:
 * Purpose: `loadConsumerGateAllow(text, today)`, the allow-list: entries that are well formed (each marked `expired`
 *          or not against `today`) and `problems` for the rest. An entry needs `product`, `step`, `match`, a `class`
 *          (`product`, `flaky`, `environment` or `known-core`; `security`, `tenant-isolation`, `data-integrity`,
 *          `leak` or none is refused and listed in `refused`), an `STA-n` issue and `expires` 1 to 30 days after
 *          `added`, not in the future; a `match` is at least 12 characters or holds a `TS` code or an `ERR_` token.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import { parse } from "yaml";

import { CONSUMER_GATE_ALLOW_CLASSES } from "#node/consumer-gate/constants/consumer-gate-allow-classes.constant";
import { CONSUMER_GATE_NEVER_ALLOW_CLASSES } from "#node/consumer-gate/constants/consumer-gate-never-allow-classes.constant";
import { CONSUMER_GATE_MAX_ALLOW_DAYS } from "#node/consumer-gate/constants/consumer-gate-max-allow-days.constant";
import type { ConsumerGateAllowEntry } from "#node/consumer-gate/types/consumer-gate-allow-entry.type";
import type { ConsumerGateAllowList } from "#node/consumer-gate/types/consumer-gate-allow-list.type";

const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_MATCH = 12;

/**
 * Parses and checks the allow-list.
 *
 * @param text - the YAML of `allow.yaml`.
 * @param today - the run date, `YYYY-MM-DD`.
 * @example
 * loadConsumerGateAllow("allow: []\n", "2026-11-01"); // { entries: [], problems: [], refused: [] }
 */
export function loadConsumerGateAllow(text: string, today: string): ConsumerGateAllowList {
  if (!ISO_DATE.test(today)) throw new Error(`allow-list: today must be YYYY-MM-DD, got ${today}`);
  const raw = (parse(text) as { allow?: unknown } | null)?.allow ?? [];
  if (!Array.isArray(raw)) throw new Error("allow-list: `allow` must be a list");
  const entries: ConsumerGateAllowEntry[] = [];
  const problems: string[] = [];
  const refused: string[] = [];
  (raw as Record<string, unknown>[]).forEach((item, index) => {
    const at = `allow[${index}]`;
    const added = String(item["added"]);
    const expires = String(item["expires"]);
    const days = (Date.parse(expires) - Date.parse(added)) / DAY_MS;
    const match = String(item["match"] ?? "");
    if (!item["product"] || !item["step"] || !match) {
      problems.push(`${at}: product, step and match are required`);
    } else if (!CONSUMER_GATE_ALLOW_CLASSES.includes(String(item["class"] ?? ""))) {
      const never = CONSUMER_GATE_NEVER_ALLOW_CLASSES.includes(String(item["class"]));
      const problem = `${at}: class ${
        never
          ? `${String(item["class"])} can never be allow-listed`
          : `must be one of ${CONSUMER_GATE_ALLOW_CLASSES.join(", ")}`
      }`;
      problems.push(problem);
      refused.push(problem);
    } else if (!/^STA-\d+$/.test(String(item["issue"] ?? ""))) {
      problems.push(`${at}: issue must be an STA-n key`);
    } else if (!ISO_DATE.test(added) || !ISO_DATE.test(expires)) {
      problems.push(`${at}: added and expires must be YYYY-MM-DD`);
    } else if (added > today) {
      problems.push(`${at}: added is in the future`);
    } else if (!(days > 0 && days <= CONSUMER_GATE_MAX_ALLOW_DAYS)) {
      problems.push(`${at}: expires must be 1 to ${CONSUMER_GATE_MAX_ALLOW_DAYS} days after added`);
    } else if (match.length < MIN_MATCH && !/TS\d{4}|ERR_/.test(match)) {
      problems.push(
        `${at}: match is too loose; use ${MIN_MATCH} characters, a TS code or an ERR_ token`,
      );
    } else {
      entries.push({
        product: String(item["product"]),
        step: String(item["step"]),
        class: String(item["class"]),
        match,
        issue: String(item["issue"]),
        added,
        expires,
        expired: expires < today,
      });
    }
  });
  return { entries, problems, refused };
}
