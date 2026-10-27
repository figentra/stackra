/**
 * Stackra file contract:
 * Purpose: the shared commitlint preset. Conventional commits plus the house type list, subject case and lengths,
 *          and the `refs-issue-key` plugin rule, which is OFF until a repo sets it with its issue prefix as the value
 *          (`[2, "always", "STA"]`). When on, keyed types need a `Refs: <PREFIX>-n` footer (ADR 0065 rule 4).
 *          Scope is the member's short name (contracts, ir, console, adr, deps, release); a root change uses `repo`.
 * Boundary: the entry: re-exports only; no repo-specific prefix lives here.
 * Runtime: node
 * Governing contract: ADR 0065 (Linear gate checked offline); ADR 0007 (documentation).
 * Owner: release-operations · Secrets: forbidden
 */
export { default } from "./constants/commitlint-preset.constant.ts";
export { KEYED_TYPES } from "./constants/keyed-types.constant.ts";
export { refsIssueKey } from "./functions/refs-issue-key.function.ts";
