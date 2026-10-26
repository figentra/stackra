/**
 * Stackra file contract:
 * Purpose: `STRUCTURE_PHASE`, phase 5 of `stackra check`: the repository structure checks (`structureFindings`): test
 *          placement, runway files, imports, the Expo form factor and every member's manifest, files and shape.
 * Boundary: reads files and runs `pnpm -r list`; notices (an unbuilt runway package) go to `io.err`.
 * Runtime: node
 * Governing contract: ADR 0022; ADR 0025; ADR 0233; ADR 0294; ADR 0296.
 */
import { readRepoContext, structureFindings, toFinding } from "@stackra/repo-checks/node";

import type { CheckPhase } from "#node/types/check-phase.type";

/** The `structure` phase. */
export const STRUCTURE_PHASE: CheckPhase = {
  name: "structure",
  tool: "repo-checks",
  adr: "0294",
  async run({ root, ci, io }) {
    const raws = await structureFindings(readRepoContext(root), {
      ci,
      warn: (text) => io.err(`${text}\n`),
    });
    return { findings: raws.map((raw) => toFinding("structure", raw)) };
  },
};
