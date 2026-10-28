/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/native-card-terminal: the `stripe_terminal` `CardTerminal`
 *          driver and the `native` `StripeTerminalBridge` driver, until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. Loadable anywhere: no module here imports a native package;
 *           each driver reads the `StackraCardTerminal` Expo module from the modules registry when it runs. The
 *           constants and functions stay internal. Certification pending (ADR 0479, STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0478 (decision 5); ADR 0479; the STA-347 stand-in barrel decision.
 */
export { NativeStripeTerminalBridgeDriver } from "#native/drivers/native-stripe-terminal-bridge.driver";
export { StripeTerminalCardTerminalDriver } from "#native/drivers/stripe-terminal-card-terminal.driver";
