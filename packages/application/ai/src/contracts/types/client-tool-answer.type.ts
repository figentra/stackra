/**
 * Stackra file contract:
 * Purpose: `ClientToolAnswer`, what a surface answers for a client tool call: the tool call id and either what the
 *          screen did (`result`) or a refusal code.
 * Boundary: a type only; the body of `ai.run.client_result` (ADR 0490 decision 4). A result reports only what the
 *           screen did, never data about records, and is validated by the runtime before the model sees it.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 4); STA-1631.
 */

/** A surface's answer to one client tool call. */
export interface ClientToolAnswer {
  /** The tool call it answers. */
  readonly toolCallId: string;

  /** What the screen did; absent when it refused. */
  readonly result?: {
    /** Whether the screen did what the tool asked. */
    readonly done: boolean;

    /** A short machine-readable note (`filter_unknown`), never text from a record. */
    readonly note?: string;
  };

  /** The code the surface refuses with (`handler_missing`); absent when it answered. */
  readonly refusal?: string;
}
