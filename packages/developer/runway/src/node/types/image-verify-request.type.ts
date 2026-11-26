/**
 * Stackra file contract:
 * Purpose: `ImageVerifyRequest`, what `verifyImage` checks one deploy image against before a deploy uses it: the
 *          reference by digest and its trust root (`ImageTrust`): the KMS key that signed it, or the keyless signer,
 *          caller repository and caller ref; and a Sigstore trusted root for an offline or private-Sigstore verify.
 * Boundary: type only; no credential.
 * Runtime: node
 * Governing contract: ADR 0174 (decision 2 and its enforcement: cosign verification at deploy); STA-609.
 */
import type { CommandRunner } from "#node/types/command-runner.type";
import type { ImageTrust } from "#node/types/image-trust.type";

/** What one image is verified against before a deploy uses it. */
export type ImageVerifyRequest = Omit<ImageTrust, "signingConfig"> & {
  /** `<image>@sha256:<digest>`; a tag alone is refused. */
  readonly reference: string;
  /** The runner that runs cosign. */
  readonly run: CommandRunner;
};
