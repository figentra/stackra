/**
 * Stackra file contract:
 * Purpose: the headers every GitHub REST call of the Worker carries.
 * Boundary: a constant only; the App token calls and the dispatch spread it and add their own authorization.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6); GitHub's REST API versioning.
 */

/** The media type, the user agent GitHub requires, and the pinned API version. */
export const GITHUB_HEADERS = {
  /** GitHub's JSON media type. */
  accept: "application/vnd.github+json",
  /** The user agent GitHub requires on every call. */
  "user-agent": "stackra-env-sync",
  /** The pinned REST API version. */
  "x-github-api-version": "2022-11-28",
} as const;
