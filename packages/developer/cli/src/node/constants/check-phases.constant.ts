/**
 * Stackra file contract:
 * Purpose: `CHECK_PHASES`, the phases of `stackra check` in run order: cheap and independent first (config, format, spelling,
 *          secrets need no install), then source-only (structure, docs, lint), then install-needing (gen, typecheck,
 *          catalogues, spec, and the opt-in test).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); the quality-gate coverage audit of 2026-10-27 (proposed `stackra check`).
 */
import { CATALOGUES_PHASE } from "#node/constants/catalogues-phase.constant";
import { CONFIG_PHASE } from "#node/constants/config-phase.constant";
import { DOCS_PHASE } from "#node/constants/docs-phase.constant";
import { FORMAT_PHASE } from "#node/constants/format-phase.constant";
import { GEN_PHASE } from "#node/constants/gen-phase.constant";
import { LINT_PHASE } from "#node/constants/lint-phase.constant";
import { SECRETS_PHASE } from "#node/constants/secrets-phase.constant";
import { SPEC_PHASE } from "#node/constants/spec-phase.constant";
import { SPELLING_PHASE } from "#node/constants/spelling-phase.constant";
import { STRUCTURE_PHASE } from "#node/constants/structure-phase.constant";
import { TEST_PHASE } from "#node/constants/test-phase.constant";
import { TYPECHECK_PHASE } from "#node/constants/typecheck-phase.constant";
import type { CheckPhase } from "#node/types/check-phase.type";

/** Every `stackra check` phase, in run order; `test` runs only on request. */
export const CHECK_PHASES: readonly CheckPhase[] = [
  CONFIG_PHASE,
  FORMAT_PHASE,
  SPELLING_PHASE,
  SECRETS_PHASE,
  STRUCTURE_PHASE,
  DOCS_PHASE,
  LINT_PHASE,
  GEN_PHASE,
  TYPECHECK_PHASE,
  CATALOGUES_PHASE,
  SPEC_PHASE,
  TEST_PHASE,
];
