/**
 * Stackra file contract:
 * Purpose: `RuntimeOnlyFieldShape`, a configuration field only the runtime environment may set, as the built
 *          `@stackra/runway` names it (`RuntimeOnlyField`): its config key, field and variable (STA-2844).
 * Boundary: type only, structural, so the runway-file check needs no import of the package.
 * Runtime: node
 * Governing contract: ADR 0296 (amendment 2026-11-26); STA-2844.
 */

/** A configuration field only the runtime environment may set. */
export type RuntimeOnlyFieldShape = {
  /** The config key (`outbox.relay_inbox`). */
  readonly config: string;

  /** The field (`environment`). */
  readonly field: string;

  /** The runtime variable it is read from (`STACKRA_ENVIRONMENT`). */
  readonly variable: string;
};
