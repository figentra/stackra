/**
 * Stackra file contract:
 * Purpose: `GEN_TOOL_REASON_CODEMOD`, 0.23.0: an L3 or L4 action is an agent tool only with `tool: true` and a
 *          reason.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 96374f4.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** An L3 or L4 action is an agent tool only with tool: true and a reason. */
export const GEN_TOOL_REASON_CODEMOD: UpgradeCodemod = {
  id: "gen-tool-reason",
  version: "0.23.0",
  title: "An L3 or L4 action is an agent tool only with tool: true and a reason",
  note: "An L3 or L4 action is no longer an agent tool by default. To keep one as a tool, write tool: true with a // reason: line; gen fails with tool_reason_missing without the reason. Owner security decision 2026-11-08.",
  source: "96374f4",
};
