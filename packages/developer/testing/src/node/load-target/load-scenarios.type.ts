/**
 * Stackra file contract:
 * Purpose: `LoadScenarios`, the named units of work a load target serves: each name is one route k6 posts to, and its
 *          function does one unit of the subject's work in process (queue a job, write a message, run a call).
 * Boundary: type only; `serveLoadTarget` reads it.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */

/** Each scenario's name (letters, digits, `.`, `_` or `-`) and the one unit of work a request to it runs. */
export type LoadScenarios = Readonly<Record<string, () => Promise<void>>>;
