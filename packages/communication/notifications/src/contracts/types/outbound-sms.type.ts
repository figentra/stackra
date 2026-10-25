/**
 * Stackra file contract:
 * Purpose: `OutboundSms`, one rendered text message as an `SmsTransport` driver sends it: the verified number, the
 *          sender id and the text in the recipient's language.
 * Boundary: a type only. The number is resolved at the moment of sending and never stored by the caller (ADR 0134);
 *           the text is an ICU message from the lang files, already formatted (ADR 0223 as amended by ADR 0294).
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1: SMS providers); ADR 0266 (the transport is a port); ADR 0134 (personal
 *                     data).
 */

/**
 * A text message ready to send.
 *
 * @example
 * const sms: OutboundSms = { to: "+966500000001", from: "ACME", text };
 * const providerId = await transport.send(sms, message.commandKey);
 */
export interface OutboundSms {
  /** The recipient's verified number in E.164 form (`+966500000001`), read at send time. */
  readonly to: `+${string}`;

  /** The sender id the provider registered for the account (`ACME`). */
  readonly from: string;

  /** The text, already formatted in the recipient's locale. */
  readonly text: string;
}
