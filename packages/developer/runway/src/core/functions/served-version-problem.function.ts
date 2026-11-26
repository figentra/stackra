/**
 * Stackra file contract:
 * Purpose: `servedVersionProblem(expected, answer)`, what is wrong with one smoke answer's version proof: the answer
 *          must name `expected` in its `x-stackra-version` header and, for a `/-/version` answer, in its body's
 *          `version` too. A smoke that reached another version (an override Cloudflare did not honour) or a Worker that
 *          names no version fails, so a smoke can never pass on the version that served before (STA-2786).
 * Boundary: pure; reads nothing of a body but `version`. The names are `WORKER_VERSION`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0536 (gate 2); ADR 0352 (decision 3); STA-2786.
 */
import { WORKER_VERSION } from "#core/constants/worker-version.constant";

/**
 * The problem with an answer's version proof, or `undefined` when it names `expected`.
 *
 * @param expected - the id of the Worker version under test.
 * @param answer - the answer's `x-stackra-version` header (`null` when absent) and, for a `/-/version` answer
 *                 (`route: true`), its parsed JSON body.
 * @example
 * servedVersionProblem("new", { header: "old" }); // "was answered by version old, not new"
 * servedVersionProblem("new", { header: "new", route: true, body: { version: "new" } }); // undefined
 */
export function servedVersionProblem(
  expected: string,
  answer: {
    readonly header: string | null | undefined;
    readonly route?: boolean;
    readonly body?: unknown;
  },
): string | undefined {
  const { header, route = false, body } = answer;
  if (!header) return `named no version (no ${WORKER_VERSION.header} header), not ${expected}`;
  if (header !== expected) return `was answered by version ${header}, not ${expected}`;
  if (!route) return undefined;
  const named =
    typeof body === "object" && body !== null ? (body as { version?: unknown }).version : undefined;
  return named === expected
    ? undefined
    : `${WORKER_VERSION.route} named version ${typeof named === "string" && named !== "" ? named : "none"}, not ${expected}`;
}
