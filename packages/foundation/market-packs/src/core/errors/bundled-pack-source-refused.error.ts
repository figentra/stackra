/**
 * Stackra file contract:
 * Purpose: `BundledPackSourceRefusedError`: the interim `bundled` pack source was configured in production without
 *          `allowBundledInProduction`. Packs served there must be signed by the platform release service (ADR 0386);
 *          the bundled source is an interim the host has to opt into explicitly.
 * Boundary: a refusal thrown when the driver is built, so boot fails loudly instead of the first resolve.
 * Runtime: isomorphic
 * Governing contract: ADR 0386 (as amended 2026-11-09: the interim bundled source); ADR 0418; ADR 0294 (decision 16).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Not retryable: the deployment's config must change. */
export class BundledPackSourceRefusedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The environment the source was refused in. */
  environment!: string;
}
