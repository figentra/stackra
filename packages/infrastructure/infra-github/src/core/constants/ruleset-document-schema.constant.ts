/**
 * Stackra file contract:
 * Purpose: `RULESET_DOCUMENT_SCHEMA`, one committed `.github/rulesets/<name>.json`: the body of GitHub's REST
 *          "create a repository ruleset" call for a branch or tag ruleset, limited to the rules the Pulumi GitHub
 *          provider applies here (creation, update, deletion, non-fast-forward, linear history, signatures, pull
 *          request, required status checks and the merge queue), each at most once.
 * Boundary: internal; `parseRuleset` checks a file with it. A rule type outside that list is refused, and so is a
 *           setting the provider cannot apply while it is on, because the program must never claim a protection it
 *           did not apply. Push rulesets (file restrictions) are not mapped.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 8: rulesets through the Pulumi GitHub provider), ADR 0119 (decision 6:
 *                     squash only), ADR 0166 (decision 3) and ADR 0288 (the merge queue), ADR 0284 (enforcement: a
 *                     tag ruleset keeps `schemas@*` immutable).
 */
import { z } from "zod";

import { mappable } from "#core/functions/mappable.function";

/** A whole minute or entry count. */
const COUNT = z.int().min(0).optional();

/** One rule. */
const RULE = z.discriminatedUnion(
  "type",
  [
    z.strictObject({
      type: z.enum([
        "creation",
        "deletion",
        "non_fast_forward",
        "required_linear_history",
        "required_signatures",
      ]),
    }),
    z.strictObject({
      type: z.literal("update"),
      parameters: mappable({ update_allows_fetch_and_merge: z.boolean().optional() }).optional(),
    }),
    z.strictObject({
      type: z.literal("pull_request"),
      parameters: mappable({
        allowed_merge_methods: z.array(z.enum(["merge", "squash", "rebase"])).min(1).optional(),
        dismiss_stale_reviews_on_push: z.boolean().optional(),
        require_code_owner_review: z.boolean().optional(),
        require_last_push_approval: z.boolean().optional(),
        required_approving_review_count: z.int().min(0).max(10).optional(),
        required_review_thread_resolution: z.boolean().optional(),
      }),
    }),
    z.strictObject({
      type: z.literal("required_status_checks"),
      parameters: mappable({
        required_status_checks: z
          .array(
            z.strictObject({ context: z.string().min(1), integration_id: z.int().optional() }),
          )
          .min(1),
        strict_required_status_checks_policy: z.boolean().optional(),
        do_not_enforce_on_create: z.boolean().optional(),
      }),
    }),
    z.strictObject({
      type: z.literal("merge_queue"),
      parameters: mappable({
        check_response_timeout_minutes: COUNT,
        grouping_strategy: z.enum(["ALLGREEN", "HEADGREEN"]).optional(),
        max_entries_to_build: COUNT,
        max_entries_to_merge: COUNT,
        merge_method: z.enum(["MERGE", "SQUASH", "REBASE"]).optional(),
        min_entries_to_merge: COUNT,
        min_entries_to_merge_wait_minutes: COUNT,
      }).optional(),
    }),
  ],
  {
    error:
      "Expected a rule this package applies: creation, update, deletion, non_fast_forward, required_linear_history, required_signatures, pull_request, required_status_checks or merge_queue",
  },
);

/** One repository ruleset. */
export const RULESET_DOCUMENT_SCHEMA = z.strictObject({
  name: z.string().min(1),
  target: z.enum(["branch", "tag"]),
  enforcement: z.enum(["active", "evaluate", "disabled"]),
  conditions: z.strictObject({
    ref_name: z.strictObject({
      include: z.array(z.string().min(1)).min(1),
      exclude: z.array(z.string().min(1)),
    }),
  }),
  bypass_actors: z
    .array(
      z.strictObject({
        actor_id: z.int().nullable().optional(),
        actor_type: z.enum([
          "Integration",
          "OrganizationAdmin",
          "RepositoryRole",
          "Team",
          "DeployKey",
        ]),
        bypass_mode: z.enum(["always", "pull_request"]),
      }),
    )
    .default([]),
  rules: z
    .array(RULE)
    .min(1)
    .refine(
      (rules) => new Set(rules.map((rule) => rule.type)).size === rules.length,
      "A rule type appears more than once",
    ),
});
