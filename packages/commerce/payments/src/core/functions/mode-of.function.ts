/**
 * Stackra file contract:
 * Purpose: `modeOf`, the connection mode of a gateway: its `mode` field, `own-key` when it names none.
 * Boundary: a wrong value in a connection record is a configuration error, so it throws a `TypeError` rather than let
 *           a typo skip the connected-account cap. A legacy mode needs a platform name after its colon.
 * Runtime: isomorphic
 * Governing contract: R4-6; A3-1.
 */
import { Enum } from "@stackra/contracts";

import { ConnectionMode } from "#contracts/enums/connection-mode.enum";
import type { PaymentConnectionMode } from "#contracts/types/payment-connection-mode.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";

/** A legacy connected-account mode with its platform. */
const LEGACY = /^legacy-connected-account:[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

/**
 * The gateway's mode.
 *
 * @throws TypeError when the connection's `mode` field is not one of the four modes.
 * @example
 * if (modeOf(gateway) === ConnectionMode.ConnectedAccount) { … }
 */
export function modeOf(gateway: Pick<PaymentGateway, "mode" | "provider">): PaymentConnectionMode {
  const mode = gateway.mode ?? ConnectionMode.OwnKey;
  if (Enum.values(ConnectionMode).includes(mode as ConnectionMode) || LEGACY.test(mode))
    return mode;
  throw new TypeError(
    `${gateway.provider} connection has mode ${JSON.stringify(mode)}: expected oauth-standard, own-key, connected-account or legacy-connected-account:<platform>`,
  );
}
