/**
 * Stackra file contract:
 * Purpose: the shape a routed repository must have before it becomes part of the GitHub API URL.
 * Boundary: a constant only; handle-request.ts tests each `ENV_SYNC_ROUTES` value against it.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6).
 */

/** `owner/repo`: letters, digits, `_`, `.` and `-` on each side, so a route can never climb out of its API path. */
export const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/;
