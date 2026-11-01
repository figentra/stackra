/**
 * Stackra file contract:
 * Purpose: `judgeConsumerGateStep(code, log, product, id, allow)`, the allow-list excusal rule: a step passes on exit
 *          0, is `allowed` when every failure line it printed has a live entry of that product and step (an entry for
 *          `test:int` covers `test:int/billing`), and otherwise fails, naming the uncovered lines and the issues of
 *          expired entries that would have excused it.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import { consumerGateSignatures } from "#node/consumer-gate/functions/consumer-gate-signatures.function";
import type { ConsumerGateAllowEntry } from "#node/consumer-gate/types/consumer-gate-allow-entry.type";
import type { ConsumerGateStepResult } from "#node/consumer-gate/types/consumer-gate-step-result.type";

/**
 * Judges one finished step.
 *
 * @param code - the step's exit code.
 * @param log - the step's output (read only on failure).
 * @param product - the product name.
 * @param id - the step id, `typecheck` or `test:int/billing`.
 * @param allow - the allow entries, each marked expired or not.
 * @example
 * judgeConsumerGateStep(0, "", "billing", "typecheck", []); // { status: "pass" }
 */
export function judgeConsumerGateStep(
  code: number,
  log: string,
  product: string,
  id: string,
  allow: readonly ConsumerGateAllowEntry[],
): Omit<ConsumerGateStepResult, "id" | "code"> {
  if (code === 0) return { status: "pass" };
  const base = id.split("/")[0];
  const mine = allow.filter(
    (entry) => entry.product === product && (entry.step === id || entry.step === base),
  );
  const entryFor = (signature: string, expired: boolean): ConsumerGateAllowEntry | undefined =>
    mine.find((entry) => entry.expired === expired && signature.includes(entry.match));
  const signatures = consumerGateSignatures(log);
  const uncovered = signatures.filter((signature) => !entryFor(signature, false));
  if (signatures.length > 0 && uncovered.length === 0) {
    return {
      status: "allowed",
      issues: [
        ...new Set(
          signatures.map(
            (signature) => (entryFor(signature, false) as ConsumerGateAllowEntry).issue,
          ),
        ),
      ],
    };
  }
  return {
    status: "fail",
    uncovered: uncovered.length > 0 ? uncovered : ["(no recognised failure line)"],
    expired: [
      ...new Set(
        signatures
          .map((signature) => entryFor(signature, true)?.issue)
          .filter((issue): issue is string => issue !== undefined),
      ),
    ],
  };
}
