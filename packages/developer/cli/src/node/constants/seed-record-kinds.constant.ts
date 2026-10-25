/**
 * Stackra file contract:
 * Purpose: `SEED_RECORD_KINDS`, the record kinds a product seed pack may hold: settings defaults, rule sets, workflow
 *          and studio templates, role and industry templates, the plan catalogue with its price lists and offers, the
 *          connector catalogue and the brand kit. A document of any other kind is refused, so a typo never seeds a
 *          record no service reads.
 * Boundary: frozen vocabulary of the configuration model, not business data: the values live in the pack. Market
 *           packs are not seed records; they sit beside the seed pack.
 * Runtime: node
 * Governing contract: config-model sections 2 to 6 (owner principle "configuration, not code", 2026-10-25); ADR 0325
 *                     (decision 7); ADR 0331 (rule sets are tenant data).
 */

/** Every record kind a seed pack document may declare. */
export const SEED_RECORD_KINDS: readonly string[] = Object.freeze([
  "settings",
  "rule-set",
  "workflow-template",
  "studio-template",
  "role-template",
  "industry-template",
  "plan-catalogue",
  "price-list",
  "offer",
  "connector-catalogue",
  "brand-kit",
]);
