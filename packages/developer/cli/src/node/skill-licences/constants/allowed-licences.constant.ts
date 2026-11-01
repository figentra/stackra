/**
 * Stackra file contract:
 * Purpose: `ALLOWED_LICENCES`, the licences an agent skill or plugin may carry: permissive, commercial use allowed.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0174 (licence allow-list); ADR 0258 (agent skills); STA-272.
 */

/** The SPDX ids `stackra skill-licences` accepts. */
export const ALLOWED_LICENCES: readonly string[] = Object.freeze([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
]);
