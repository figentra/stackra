/**
 * Stackra file contract:
 * Purpose: `ImageVerifyRequest`, what `verifyImage` checks one deploy image against before a deploy uses it: the
 *          reference by digest and either the KMS key that signed it or the keyless signer and caller repository.
 * Boundary: type only; no credential.
 * Runtime: node
 * Governing contract: ADR 0174 (decision 2 and its enforcement: cosign verification at deploy); STA-609.
 */
import type { CommandRunner } from "#node/types/command-runner.type";

/** What one image is verified against before a deploy uses it. */
export type ImageVerifyRequest = {
  /** `<image>@sha256:<digest>`; a tag alone is refused. */
  readonly reference: string;
  /** The KMS key reference that signed it; without one the signature must be keyless. */
  readonly key?: string | undefined;
  /** For a keyless signature: the `owner/repo` whose job signed it. */
  readonly sourceRepository?: string | undefined;
  /** For a keyless signature: the signer identity pattern (default `IMAGE_SUPPLY_CHAIN_SETTINGS.signerIdentity`). */
  readonly identity?: string | undefined;
  /** The runner that runs cosign. */
  readonly run: CommandRunner;
};
