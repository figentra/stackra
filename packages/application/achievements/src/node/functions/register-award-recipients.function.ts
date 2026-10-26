/**
 * Stackra file contract:
 * Purpose: `registerAwardRecipients`, how a consumer lets award kinds be granted to records of its models: one row per
 *          model with the fields a kind's criteria over it may test.
 * Boundary: fills the internal `AWARD_RECIPIENTS` registry at module load. A key registered twice with other rules is
 *           refused, so two modules cannot disagree about one model.
 * Runtime: node
 * Governing contract: ADR 0368 (decisions 1 and 4); ADR 0331 (decision 4).
 */
import type { AwardRecipient } from "#contracts/index";
import { AWARD_RECIPIENTS } from "#node/constants/award-recipients.constant";

/** A model key: a module key, a dot, a snake_case name. */
const MODEL_KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * Registers the award rules of each recipient model in `rows`.
 *
 * @example
 * registerAwardRecipients([{ model: "workforce.member", rules: MEMBER_AWARD_RULES }]);
 * @throws TypeError for a malformed key, or a key already registered with other rules.
 */
export function registerAwardRecipients(rows: readonly AwardRecipient[]): void {
  for (const row of rows) {
    if (!MODEL_KEY.test(row.model))
      throw new TypeError(`"${row.model}" is not a model key: <module>.<model>`);
    const known = AWARD_RECIPIENTS.get(row.model);
    if (known !== undefined && known !== row.rules)
      throw new TypeError(`The recipient model ${row.model} is registered with other rules`);
    AWARD_RECIPIENTS.set(row.model, row.rules);
  }
}
