/**
 * Stackra file contract:
 * Purpose: `ITEM_REQUIRED_FILES`, the file an item of a kind must hold at its root: `SKILL.md` for a skill,
 *          `agent.md` for an agent. `stackra publish` refuses a member without it; `stackra add` a tarball without it.
 * Boundary: data only; an `mcp` item's entry is `stackra.mcp` and a plugin's manifest is not checked here.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11: what each kind's tarball holds).
 */
import { StackraKind } from "@stackra/skills/contracts";

/** The root file each kind needs, where it needs one. */
export const ITEM_REQUIRED_FILES: Readonly<Partial<Record<StackraKind, string>>> = {
  [StackraKind.Skill]: "SKILL.md",
  [StackraKind.Agent]: "agent.md",
};
