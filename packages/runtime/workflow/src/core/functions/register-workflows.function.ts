/**
 * Stackra file contract:
 * Purpose: `registerWorkflows`, how gen's generated entry tells the engine the locked key of each workflow and signal
 *          of the `workflows/` group (and of each event a step waits for), so a run started in one process resumes in
 *          another on the class of its pinned version, and a held signal or event matches its wait, by key.
 * Boundary: writes the process-wide `WORKFLOW_KEYS`; a later row for a class replaces its earlier key. Checks each row,
 *           so a wrong row fails at boot rather than on the first resume. Two workflow classes share a key only with
 *           different versions; the key then names the highest. A class nobody registered is registered under its
 *           class name when the engine first uses it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); ADR 0152 (decisions 1 and 2: event waits, the version pin); the
 *                     queue precedent (`registerJobs`).
 */
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { WORKFLOW_KEYS } from "#core/constants/workflow-keys.constant";

/** The kinds a key may name: a workflow, a signal, and an event a step waits for. */
const KINDS: ReadonlySet<string> = new Set([
  "workflow",
  "signal",
  "domain_event",
  "integration_event",
]);

/** The version of a workflow class (1 unless its options say otherwise); `undefined` for another kind. */
function versionOf(type: AnyClass): number | undefined {
  const record = kindOf(type);
  if (record?.kind !== "workflow") return undefined;
  return (record.options as { readonly version?: number }).version ?? 1;
}

/**
 * Registers workflow, signal and awaited event classes with their locked keys.
 *
 * @throws TypeError when a row's class is not a workflow, a signal or an event, its key is empty, or another class has
 *         its key (for a workflow: its key and version).
 * @example
 * registerWorkflows([
 *   { type: RedeemPointsWorkflow, key: "loyalty_kit.redeem_points" },
 *   { type: RedeemPointsWorkflowV2, key: "loyalty_kit.redeem_points" }, // Workflow({ version: 2 })
 *   { type: RedemptionConfirmed, key: "loyalty_kit.redemption_confirmed" },
 * ]);
 */
export function registerWorkflows(
  rows: readonly { readonly type: AnyClass; readonly key: string }[],
): void {
  for (const { type, key } of rows) {
    if (!KINDS.has(kindOf(type)?.kind ?? ""))
      throw new TypeError(
        `registerWorkflows: ${type.name} is not a workflow, a signal or an event`,
      );
    if (typeof key !== "string" || key === "")
      throw new TypeError(`registerWorkflows: ${type.name} needs its locked key`);
    const version = versionOf(type);
    const holder = WORKFLOW_KEYS.byKey.get(key);
    const held = holder === undefined ? undefined : versionOf(holder);
    if (holder !== undefined && holder !== type) {
      const pinned =
        version === undefined ? undefined : WORKFLOW_KEYS.versions.get(`${key}@${version}`);
      if (version === undefined || held === undefined || (pinned !== undefined && pinned !== type))
        throw new TypeError(
          `registerWorkflows: ${type.name} and ${holder.name} share the key ${key}`,
        );
    }
    const previous = WORKFLOW_KEYS.keys.get(type);
    if (previous !== undefined) {
      if (WORKFLOW_KEYS.byKey.get(previous) === type) WORKFLOW_KEYS.byKey.delete(previous);
      if (version !== undefined) WORKFLOW_KEYS.versions.delete(`${previous}@${version}`);
    }
    const current = WORKFLOW_KEYS.byKey.get(key);
    if (current === undefined || (versionOf(current) ?? 0) < (version ?? 0))
      WORKFLOW_KEYS.byKey.set(key, type);
    WORKFLOW_KEYS.keys.set(type, key);
    if (version !== undefined) WORKFLOW_KEYS.versions.set(`${key}@${version}`, type);
  }
}
