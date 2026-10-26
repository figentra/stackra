/**
 * Stackra file contract:
 * Purpose: `RunwayRefusedError`, thrown when a Runway step refuses a release by policy rather than by shape: a
 *          white-label build under the platform's store accounts before the store-guideline check is recorded.
 * Boundary: a plain `Error` with a snake_case code; the message says which setting or record clears it.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decision 8, enforcement: no tenant build under the platform's accounts until the
 *                     Apple 4.2.6 and 4.3 checks are recorded), ADR 0231 (snake_case codes).
 */

/**
 * A release a policy refuses.
 *
 * @example
 * await buildMobileApps([whiteLabel], builder, { platformPublishingCleared: false });
 * // throws RunwayRefusedError with code "platform_publishing_not_cleared"
 */
export class RunwayRefusedError extends Error {
  /** `platform_publishing_not_cleared`. */
  readonly code: "platform_publishing_not_cleared";

  /**
   * @param code - the refusal.
   * @param message - what clears it.
   */
  constructor(code: "platform_publishing_not_cleared", message: string) {
    super(message);
    this.name = "RunwayRefusedError";
    this.code = code;
  }
}
