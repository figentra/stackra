/**
 * Stackra file contract:
 * Purpose: `ACTION_PERMISSION_RULES`, the `Rules` of the AI action permission matrix (`rule-set:os:ai-action-permissions`,
 *          consumer `ai.action_permissions`): one outcome kind, `row`, whose parameters are a matrix row (the action,
 *          its state, and the role, record, data class and approver rule that narrow it), so the matrix is an ordinary
 *          rule set: seeded per product from a `RuleSetPack$`, edited by the tenant in the rules studio, versioned on
 *          `HasRevisions`.
 * Boundary: a value, built once. The fact source `call` (the action key) exists because a `Rules` needs one; the
 *           matrix's condition is kept `{ all: [] }` and the reader (`actionPermissionRowsOf`) reads the outcomes only:
 *           rows narrow themselves (ADR 0398 decision 1). Up to 500 rows. The state codes are `@stackra/ai`'s
 *           `ActionPermission`, checked exhaustively by type; this package holds no row and no default.
 * Runtime: isomorphic
 * Governing contract: ADR 0398 (decisions 1, 2 and 6); ADR 0331 (decisions 4 and 9); config-model section 5 (rule sets
 *                     are data); STA-1250.
 */
import type { ActionPermission } from "@stackra/ai";
import type { I18nKey } from "@stackra/i18n";

import { FieldType } from "#contracts/index";
import { Rules } from "#core/values/rules.value";

/** The lang key of `path` in this package's `matrix` catalogue section. */
const label = (path: string): I18nKey => `rules::matrix.${path}` as I18nKey;

/** Each matrix state's code with its label; `satisfies` keeps it in step with `ActionPermission`. */
const STATES = {
  off: label("states.off"),
  suggest: label("states.suggest"),
  after_approval: label("states.after_approval"),
  on_its_own: label("states.on_its_own"),
} satisfies Record<ActionPermission, I18nKey>;

/** A yes-or-no parameter: an enum of two codes (ADR 0331 fixes seven field types, none boolean). */
const YES_NO = { yes: label("answers.yes"), no: label("answers.no") };

/** An optional text parameter. */
const narrowing = (path: string) => ({
  type: FieldType.String,
  label: label(path),
  optional: true,
});

/**
 * The matrix's registry.
 *
 * @example
 * const rows = actionPermissionRowsOf(ACTION_PERMISSION_RULES.checkOutcomes(revision.outcomes));
 */
export const ACTION_PERMISSION_RULES = Rules.create({
  key: "ai.action_permissions",
  sources: [
    { key: "call", fields: { action: { type: FieldType.String, label: label("facts.action") } } },
  ],
  outcomes: [
    {
      key: "row",
      label: label("outcomes.row"),
      params: {
        action: { type: FieldType.String, label: label("params.action") },
        state: { type: FieldType.Enum, label: label("params.state"), values: STATES },
        role: narrowing("params.role"),
        recordKind: narrowing("params.record_kind"),
        recordId: narrowing("params.record_id"),
        dataClass: narrowing("params.data_class"),
        seatKind: narrowing("params.seat_kind"),
        notRequester: {
          type: FieldType.Enum,
          label: label("params.not_requester"),
          values: YES_NO,
          optional: true,
        },
        stepUp: {
          type: FieldType.Enum,
          label: label("params.step_up"),
          values: YES_NO,
          optional: true,
        },
      },
    },
  ],
  maxOutcomes: 500,
});
