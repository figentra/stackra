/**
 * Stackra file contract:
 * Purpose: `DevComposePlan`, what `devComposeOf` returns: the lane's Compose file and the one every lane shares
 *          (each absent when it has no service), the planned containers, the variables a member's local run gets and
 *          every name the compose provides, the placeholder credentials given only to a member with none of its own, the refusals and the warnings.
 * Boundary: type only. With any refusal the files are absent: nothing half-planned starts.
 * Runtime: isomorphic
 * Governing contract: ADR 0199 (decision 3); ADR 0296 (decision 1); STA-2664 (item 6).
 */
import type { ComposeDocument } from "#core/types/compose-document.type";
import type { DevCredentialFallback } from "#core/types/dev-credential-fallback.type";
import type { DevInfraIssue } from "#core/types/dev-infra-issue.type";
import type { DevInfraService } from "#core/types/dev-infra-service.type";

/** The dev compose of one lane. */
export type DevComposePlan = {
  /** The lane's own containers (`<project>-dev-lane-<n>`). */
  readonly lane?: ComposeDocument;
  /** The containers every lane shares (`<project>-dev-shared`). */
  readonly shared?: ComposeDocument;
  /** Every planned container, opt-in ones included. */
  readonly services: readonly DevInfraService[];
  /** The variables a member's local run gets from the containers that start (opt-in ones only when asked). */
  readonly env: Readonly<Record<string, string>>;
  /**
   * The placeholder credentials of the containers that start, kept out of `env`: a member's run gets each only when
   * it has no credential of its own on that chain (a global `AWS_ACCESS_KEY_ID` would shadow the developer's profile for
   * every AWS client, not only the S3 one).
   */
  readonly fallbackCredentials: readonly DevCredentialFallback[];
  /** Every variable name a planned container can provide, opt-in ones included. */
  readonly provides: readonly string[];
  /** The refusals; the files are absent when there is one. */
  readonly issues: readonly DevInfraIssue[];
  /** What is allowed but worth a line (an image not pinned by digest, a ClamAV port the media default misses). */
  readonly warnings: readonly string[];
};
