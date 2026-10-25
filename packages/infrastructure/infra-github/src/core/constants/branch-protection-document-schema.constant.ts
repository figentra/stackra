/**
 * Stackra file contract:
 * Purpose: `BRANCH_PROTECTION_DOCUMENT_SCHEMA`, the committed `.github/branch-protection.json`: the shape of
 *          `tools/schemas/branch-protection.schema.json` (one branch, and the body of GitHub's REST "update branch
 *          protection" call with its four nullable keys required), limited to what the Pulumi GitHub provider applies.
 * Boundary: internal; `parseBranchProtection` checks the file with it. It accepts what the canonical schema accepts,
 *           except a push restriction (GitHub names its actors by node id, which the file does not hold) and any
 *           other setting the provider cannot apply while it is on, which it refuses rather than drops.
 * Runtime: isomorphic
 * Governing contract: ADR 0012 (code host and CI), ADR 0171 (decision 8), `tools/schemas/branch-protection.schema.json`.
 */
import { z } from "zod";

import { mappable } from "#core/functions/mappable.function";

/** The branch protection file. */
export const BRANCH_PROTECTION_DOCUMENT_SCHEMA = z.strictObject({
  $schema: z.string().optional(),
  comment: z.string().optional(),
  branch: z.string().min(1),
  rules: mappable({
    required_status_checks: mappable({
      strict: z.boolean().optional(),
      contexts: z.array(z.string().min(1)).optional(),
    }).nullable(),
    enforce_admins: z.boolean().nullable(),
    required_pull_request_reviews: mappable({
      dismiss_stale_reviews: z.boolean().optional(),
      require_code_owner_reviews: z.boolean().optional(),
      required_approving_review_count: z.int().min(0).max(6).optional(),
      require_last_push_approval: z.boolean().optional(),
    }).nullable(),
    restrictions: z.null({
      error:
        "Push restrictions name their actors by node id, which this file does not hold: set them in GitHub by hand and keep null here",
    }),
    required_linear_history: z.boolean().optional(),
    allow_force_pushes: z.boolean().nullable().optional(),
    allow_deletions: z.boolean().optional(),
    required_conversation_resolution: z.boolean().optional(),
    lock_branch: z.boolean().optional(),
  }),
});
