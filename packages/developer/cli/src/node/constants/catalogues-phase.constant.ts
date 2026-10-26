/**
 * Stackra file contract:
 * Purpose: `CATALOGUES_PHASE`, phase 10 of `stackra check`: lang catalogue completeness (`catalogueFindings`): keys,
 *          namespaces, locales and ICU placeholders against the English source.
 * Boundary: reads lang files only.
 * Runtime: node
 * Governing contract: ADR 0403.
 */
import { catalogueFindings, readRepoContext, toFinding } from "@stackra/repo-checks/node";

import type { CheckPhase } from "#node/types/check-phase.type";

/** The `catalogues` phase. */
export const CATALOGUES_PHASE: CheckPhase = {
  name: "catalogues",
  tool: "repo-checks",
  adr: "0403",
  async run({ root }) {
    return {
      findings: catalogueFindings(readRepoContext(root)).map((raw) => toFinding("catalogues", raw)),
    };
  },
};
