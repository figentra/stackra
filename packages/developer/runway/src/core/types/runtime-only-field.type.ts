/**
 * Stackra file contract:
 * Purpose: `RuntimeOnlyField`, a configuration field that only the runtime environment may set: the config key and
 *          field a package's manifest `env` row maps to a safety-critical variable (`SAFETY_CRITICAL_VARIABLES` of
 *          @stackra/config, `STACKRA_ENVIRONMENT` first). A runway `config` block may never set one (STA-2844).
 * Boundary: type only; names, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (amendment 2026-11-26: safety-critical keys come from the runtime only); STA-2844.
 */

/** A field the values layer may never set. */
export type RuntimeOnlyField = {
  /** The config key whose block holds the field (`outbox.relay_inbox`). */
  readonly config: string;

  /** The field of that configuration (`environment`). */
  readonly field: string;

  /** The runtime variable the field is read from (`STACKRA_ENVIRONMENT`). */
  readonly variable: string;
};
