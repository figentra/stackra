/**
 * Stackra file contract:
 * Purpose: `InboxVerification`, an `InboxVerifier`'s verdict: the verified sender, or why the request was refused.
 * Boundary: a type only. A reason is a fixed snake_case word the inbox logs; it never holds the body.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 18, amendment of 2026-11-02).
 */
import type { VerifiedSender } from "#contracts/types/verified-sender.type";

/** A verified sender, or a refusal reason. */
export type InboxVerification =
  | { readonly verified: true; readonly sender: VerifiedSender }
  | {
      readonly verified: false;
      /** `missing_headers`, `malformed_headers`, `stale`, `future`, `unknown_key` or `bad_signature`. */
      readonly reason: string;
    };
