/**
 * Stackra file contract:
 * Purpose: `NativeReader`, a card reader as the `StackraCardTerminal` Expo module reports it: its serial number and
 *          the SDK's own name for its device type.
 * Boundary: a type only; the module passes the SDK's values through unmapped (`deviceType` is the iOS enum case name
 *           or the Android enum name), and the TypeScript drivers read them.
 * Runtime: isomorphic
 * Governing contract: ADR 0479 (decisions 1 and 2); ADR 0478 (decision 5).
 */

/** A discovered or connected reader. */
export interface NativeReader {
  /** The reader's serial number, the `terminalId` it pairs by. */
  readonly serialNumber: string;

  /** The SDK's device type (`stripeM2`, `wisePad3`, `tapToPay`; `STRIPE_M2`, `TAP_TO_PAY_DEVICE`). */
  readonly deviceType: string;
}
