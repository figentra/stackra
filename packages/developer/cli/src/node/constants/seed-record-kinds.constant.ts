/**
 * Stackra file contract:
 * Purpose: `SEED_RECORD_KINDS`, the record kinds a product seed pack may hold: settings defaults, rule sets, workflow
 *          and studio templates, role and industry templates, checklist templates (onboarding, exit and fix lists),
 *          the plan catalogue with its price lists, offers, fee schedules and rate cards, the connector catalogue and
 *          the brand kit. A document of any other kind is refused, so a typo never seeds a
 *          record no service reads.
 * Boundary: frozen vocabulary of the configuration model, not business data: the values live in the pack. Market
 *           packs are not seed records; they sit beside the seed pack.
 * Runtime: node
 * Governing contract: config-model sections 2 to 6 (owner principle "configuration, not code", 2026-10-25); ADR 0325
 *                     (decision 7); ADR 0331 (rule sets are tenant data); ADR 0391 (plan catalogue: fee schedules and
 *                     rate cards); RV-22 (checklist templates are seed data, STA-776).
 */

/** Every record kind a seed pack document may declare. */
export const SEED_RECORD_KINDS: readonly string[] = Object.freeze([
  "settings",
  "rule-set",
  "workflow-template",
  "studio-template",
  "role-template",
  "industry-template",
  "checklist-template",
  "plan-catalogue",
  "price-list",
  "offer",
  "fee-schedule",
  "rate-card",
  "connector-catalogue",
  "brand-kit",
]);
