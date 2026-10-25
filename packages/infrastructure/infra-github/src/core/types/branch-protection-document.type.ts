/**
 * Stackra file contract:
 * Purpose: `BranchProtectionDocument`, the committed `.github/branch-protection.json` as `parseBranchProtection`
 *          returns it: one branch and GitHub's REST branch protection body (snake_case).
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 8), `tools/schemas/branch-protection.schema.json`.
 */
import type { z } from "zod";

import type { BRANCH_PROTECTION_DOCUMENT_SCHEMA } from "#core/constants/branch-protection-document-schema.constant";

/** The branch protection of one branch. */
export type BranchProtectionDocument = z.output<typeof BRANCH_PROTECTION_DOCUMENT_SCHEMA>;
