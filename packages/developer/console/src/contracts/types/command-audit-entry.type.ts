/**
 * Stackra file contract:
 * Purpose: `CommandAuditEntry`, the record of one run of an audited command: who ran it, what they ran with which
 *          values, when, and how it ended.
 * Boundary: a type only; a secret value is already `[redacted]` here, so a sink may store every field as given.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-015 and FR-016.
 */

/** One run of an audited command. */
export interface CommandAuditEntry {
  /** The operator: `STACKRA_OPERATOR`, else the login the environment names. */
  readonly operator: string;

  /** The command's name (`db:migrate`), never the alias that was typed. */
  readonly command: string;

  /** The arguments and options by command-line name, with secret values written `[redacted]`. */
  readonly values: Readonly<Record<string, unknown>>;

  /** When the run started. */
  readonly at: Date;

  /** `ok` (exit code 0), `cancelled` (a signal or a cancelled prompt) or `failed`. */
  readonly outcome: "ok" | "failed" | "cancelled";

  /** The run's exit code. */
  readonly exitCode: number;
}
