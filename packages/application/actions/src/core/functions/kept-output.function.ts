/**
 * Stackra file contract:
 * Purpose: `keptOutput`, the copy of an action's output the idempotency store may keep: every top-level field the
 *          output schema marks `@ShownOnce` (a signing secret, a new API key) is left out, and `secretOmitted: true`
 *          says so, so a replay tells the client to rotate if it lost the first response.
 * Boundary: pure; never edits `output`, which the first caller still receives whole. An output without a registered
 *           schema, or that is not an object, is kept as it is. Nothing shown once is kept, not even sealed (STA-2568).
 *           shortcut: top-level fields only; mark a nested secret's owner field, or walk nested shapes once one needs it.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3: key, payload hash and result); ADR 0138 (as amended: the idempotency step).
 */
import type { AnyClass } from "@stackra/container";
import { ShownOnce } from "@stackra/validation";

/**
 * What the idempotency store keeps of `output`.
 *
 * @example
 * keptOutput(RegisterEndpointOutput, { endpointId: "whe_1", signingSecret: "whsec_…" });
 * // { endpointId: "whe_1", secretOmitted: true }
 */
export function keptOutput(type: AnyClass | undefined, output: unknown): unknown {
  if (type === undefined || typeof output !== "object" || output === null) return output;
  const shown = ShownOnce.members(type);
  if (![...shown.keys()].some((name) => typeof name === "string" && Object.hasOwn(output, name)))
    return output;
  const kept = Object.entries(output).filter(([name]) => !shown.has(name));
  return { ...Object.fromEntries(kept), secretOmitted: true };
}
