/**
 * Stackra file contract:
 * Purpose: `ActionRun<O>`, what one run of the action runner resolves to: the answer, a cancelled confirmation or the
 *          refusal.
 * Boundary: a type only; a refusal resolves (it was shown as a toast), so a caller never needs a catch for one.
 * Runtime: isomorphic
 * Governing contract: ADR 0139; ADR 0140 (refusals).
 */
import type { ClientError } from "@stackra/clients";

import type { ActionRunStatus } from "#react/action-runner/action-run-status.enum";

/** The end of one run. */
export type ActionRun<O = unknown> =
  | {
      /** The action ran. */
      readonly status: typeof ActionRunStatus.Done;
      /** Its answer. */
      readonly data: O;
    }
  | {
      /** The user declined the confirmation. */
      readonly status: typeof ActionRunStatus.Cancelled;
    }
  | {
      /** The producer refused. */
      readonly status: typeof ActionRunStatus.Refused;
      /** The refusal. */
      readonly error: ClientError;
    };
