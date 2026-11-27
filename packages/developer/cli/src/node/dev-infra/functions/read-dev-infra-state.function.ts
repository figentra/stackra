/**
 * Stackra file contract:
 * Purpose: `readDevInfraState(root)`, what the last `stackra dev` at the workspace `root` started (`.stackra/dev/infra.json`),
 *          or undefined when it started no dev compose (none declared, `--no-infra`, or never run).
 * Boundary: reads one file; a file that is not the state shape counts as none, so a member's run never fails on it.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 3); STA-2664 (item 6).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { DEV_INFRA_FILES } from "#node/dev-infra/constants/dev-infra-files.constant";
import type { DevInfraState } from "#node/dev-infra/types/dev-infra-state.type";

/**
 * The dev compose state of `root`.
 *
 * @param root - the workspace root.
 * @example
 * readDevInfraState("/work/acme"); // { lane: 0, optIn: [] }
 */
export function readDevInfraState(root: string): DevInfraState | undefined {
  const file = join(root, DEV_INFRA_FILES.state);
  if (!existsSync(file)) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
  const { lane, optIn } = (parsed ?? {}) as { lane?: unknown; optIn?: unknown };
  if (typeof lane !== "number" || !Number.isInteger(lane) || lane < 0) return undefined;
  if (!Array.isArray(optIn) || !optIn.every((name) => typeof name === "string")) return undefined;
  return { lane, optIn: optIn as string[] };
}
