/**
 * Stackra file contract:
 * Purpose: `PaymentConnectionMode`, the mode a payments Connection carries in its `mode` field: one of the three
 *          `ConnectionMode` codes or a `legacy-connected-account:<platform>`.
 * Boundary: a type only; `modeOf` reads it from a gateway and refuses a value that is neither.
 * Runtime: isomorphic
 * Governing contract: R4-6; A3-1.
 */
import type { ConnectionMode } from "#contracts/enums/connection-mode.enum";
import type { LegacyConnectedAccountMode } from "#contracts/types/legacy-connected-account-mode.type";

/** One of the four modes. */
export type PaymentConnectionMode = ConnectionMode | LegacyConnectedAccountMode;
