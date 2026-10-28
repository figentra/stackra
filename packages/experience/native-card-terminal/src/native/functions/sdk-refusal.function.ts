/**
 * Stackra file contract:
 * Purpose: `sdkRefusal`, the refusal of a Stripe Terminal SDK error: a refused or disabled Bluetooth or location
 *          permission is `permission_denied` on `bluetooth`; any other error is `unavailable` on `card_terminal`.
 * Boundary: internal; pure. Reads the code only; the SDK's message is never put in a refusal.
 * Runtime: isomorphic
 * Governing contract: ADR 0479 (decision 2); ADR 0253 (decision 4); ADR 0250 (decision 3).
 */
import { PlatformCapability } from "@stackra/platform";
import type { StripeBridgeError } from "@stackra/payments/contracts";

import { STRIPE_TERMINAL } from "#native/constants/stripe-terminal.constant";
import { refuse } from "#native/functions/refuse.function";
import { sdkName } from "#native/functions/sdk-name.function";

/**
 * The refusal of `error`.
 *
 * @example
 * if (found.error !== undefined) return sdkRefusal(found.error);
 */
export function sdkRefusal(error: StripeBridgeError): ReturnType<typeof refuse> {
  const code = sdkName(error.code);
  return (STRIPE_TERMINAL.permissionCodes as readonly string[]).includes(code)
    ? refuse(PlatformCapability.Bluetooth, "permission_denied")
    : refuse(PlatformCapability.CardTerminal, "unavailable");
}
