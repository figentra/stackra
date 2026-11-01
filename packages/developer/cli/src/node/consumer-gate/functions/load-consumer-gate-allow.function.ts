/**
 * Stackra file contract:
 * Purpose: `loadConsumerGateAllow(text, today)`, the allow-list: entries that are well formed (each marked `expired`
 *          or not against `today`) and `problems` for the rest. An entry needs `product`, `step`, `match`, an `STA-n`
 *          issue and `expires` 1 to 30 days after `added`.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import { parse } from "yaml";

import { CONSUMER_GATE_MAX_ALLOW_DAYS } from "#node/consumer-gate/constants/consumer-gate-max-allow-days.constant";
import type { ConsumerGateAllowEntry } from "#node/consumer-gate/types/consumer-gate-allow-entry.type";
import type { ConsumerGateAllowList } from "#node/consumer-gate/types/consumer-gate-allow-list.type";

const DAY_MS = 86_400_000;

/**
 * Parses and checks the allow-list.
 *
 * @param text - the YAML of `allow.yaml`.
 * @param today - the run date, `YYYY-MM-DD`.
 * @example
 * loadConsumerGateAllow("allow: []\n", "2026-11-01"); // { entries: [], problems: [] }
 */
export function loadConsumerGateAllow(text: string, today: string): ConsumerGateAllowList {
  const raw = (parse(text) as { allow?: Record<string, unknown>[] } | null)?.allow ?? [];
  const entries: ConsumerGateAllowEntry[] = [];
  const problems: string[] = [];
  raw.forEach((item, index) => {
    const at = `allow[${index}]`;
    const days = (Date.parse(String(item["expires"])) - Date.parse(String(item["added"]))) / DAY_MS;
    if (!item["product"] || !item["step"] || !item["match"]) {
      problems.push(`${at}: product, step and match are required`);
    } else if (!/^STA-\d+$/.test(String(item["issue"] ?? ""))) {
      problems.push(`${at}: issue must be an STA-n key`);
    } else if (!(days > 0 && days <= CONSUMER_GATE_MAX_ALLOW_DAYS)) {
      problems.push(`${at}: expires must be 1 to ${CONSUMER_GATE_MAX_ALLOW_DAYS} days after added`);
    } else {
      entries.push({
        product: String(item["product"]),
        step: String(item["step"]),
        match: String(item["match"]),
        issue: String(item["issue"]),
        added: String(item["added"]),
        expires: String(item["expires"]),
        expired: String(item["expires"]) < today,
      });
    }
  });
  return { entries, problems };
}
