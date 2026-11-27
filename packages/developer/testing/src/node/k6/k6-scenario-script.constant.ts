/**
 * Stackra file contract:
 * Purpose: `K6_SCENARIO_SCRIPT`, the one k6 script every load test runs: each iteration posts to
 *          `<STACKRA_LOAD_TARGET>/scenarios/<STACKRA_LOAD_NAME>` and checks for a 204, under the executor and the
 *          thresholds passed as JSON in `STACKRA_LOAD_EXECUTOR` and `STACKRA_LOAD_THRESHOLDS`.
 * Boundary: data only (the script's source); `runK6` writes it to a temporary file and k6 runs it in its own JavaScript
 *           runtime, never node. It sends no body and reads no secret.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */

/** The k6 script: one POST per iteration, a 204 check, the executor and thresholds from the environment. */
export const K6_SCENARIO_SCRIPT = [
  'import http from "k6/http";',
  'import { check } from "k6";',
  "",
  "const target = __ENV.STACKRA_LOAD_TARGET;",
  "const name = __ENV.STACKRA_LOAD_NAME;",
  "",
  "export const options = {",
  "  scenarios: { soak: JSON.parse(__ENV.STACKRA_LOAD_EXECUTOR) },",
  "  thresholds: JSON.parse(__ENV.STACKRA_LOAD_THRESHOLDS),",
  '  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],',
  "};",
  "",
  "export default function () {",
  "  const response = http.post(`${target}/scenarios/${name}`, null);",
  "  check(response, { served: (r) => r.status === 204 });",
  "}",
  "",
].join("\n");
