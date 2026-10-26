/**
 * Stackra file contract:
 * Purpose: `DOCS_PHASE`, phase 6 of `stackra check`: the doc standard (`docsFindings`): contract headers, TSDoc on exports
 *          and their members, and no types inside doc tags.
 * Boundary: reads source files only; it never judges the wording of a block.
 * Runtime: node
 * Governing contract: ADR 0007 (amendment 2026-10-21).
 */
import { docsFindings, readRepoContext, toFinding } from "@stackra/repo-checks/node";

import type { CheckPhase } from "#node/types/check-phase.type";

/** The `docs` phase. */
export const DOCS_PHASE: CheckPhase = {
  name: "docs",
  tool: "repo-checks",
  adr: "0007",
  async run({ root }) {
    return { findings: docsFindings(readRepoContext(root)).map((raw) => toFinding("docs", raw)) };
  },
};
