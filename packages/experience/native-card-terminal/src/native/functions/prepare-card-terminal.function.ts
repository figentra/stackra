/**
 * Stackra file contract:
 * Purpose: `prepareCardTerminal`, which readies the `StackraCardTerminal` module for a call: it answers the SDK's
 *          connection-token requests through `StripeTerminalServer` (once per module, whichever driver comes first)
 *          and initialises the SDK.
 * Boundary: internal. Keeps no state of its own: the module's listener count says whether the relay is set. A token
 *           the server refuses is answered as a failure (`connection_token_failed`), never with a stored value, and
 *           the server's message never reaches the SDK.
 * Runtime: isomorphic
 * Governing contract: ADR 0479 (decisions 3 and 4); ADR 0478 (decision 5).
 */
import type { StripeTerminalServer } from "#contracts/ports/stripe-terminal-server.port";
import type { CardTerminalNativeModule } from "#contracts/types/card-terminal-native-module.type";
import { STRIPE_TERMINAL } from "#native/constants/stripe-terminal.constant";
import { cardTerminalModule } from "#native/functions/card-terminal-module.function";

/**
 * The module, ready for SDK calls, or `undefined` where it is not linked or the SDK would not start.
 *
 * @example
 * const module = await prepareCardTerminal(this.server);
 * if (module === undefined) return refuse(PlatformCapability.CardTerminal, "unavailable");
 */
export async function prepareCardTerminal(
  server: StripeTerminalServer,
): Promise<CardTerminalNativeModule | undefined> {
  const module = cardTerminalModule();
  if (module === undefined) return undefined;
  if (module.listenerCount(STRIPE_TERMINAL.tokenEvent) === 0)
    module.addListener(STRIPE_TERMINAL.tokenEvent, ({ requestId }) => {
      void server.connectionToken().then(
        (token) => module.resolveConnectionToken(requestId, token),
        () => module.rejectConnectionToken(requestId, STRIPE_TERMINAL.tokenFailure),
      );
    });
  try {
    await module.initialize();
  } catch {
    return undefined;
  }
  return module;
}
