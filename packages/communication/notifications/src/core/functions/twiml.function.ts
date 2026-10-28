/**
 * Stackra file contract:
 * Purpose: `twiml(instructions)`, provider-neutral `CallInstruction`s as a TwiML `<Response>` document: `<Say>` with the
 *          data-chosen language and voice, `<Play>`, `<Gather input="speech">` for speech to text, `<Dial>` for the
 *          handover to a human, `<Hangup>`.
 * Boundary: pure. Every text and attribute is XML-escaped, so a caller's words or a template never inject markup.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1: voice through Twilio); PUT-216.
 */
import type { CallInstruction } from "@stackra/integrations/contracts";

/** `value` safe inside XML text or a double-quoted attribute. */
const escape = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

/** Attributes, the undefined ones left out. */
const attributes = (pairs: Readonly<Record<string, string | number | undefined>>): string =>
  Object.entries(pairs)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ` ${key}="${escape(String(value))}"`)
    .join("");

/**
 * The TwiML of `instructions`.
 *
 * @example
 * twiml([{ kind: "say", text: "مرحبا", speech: { language: "ar-AE" } }, { kind: "hang_up" }]);
 * // <?xml version="1.0" encoding="UTF-8"?><Response><Say language="ar-AE">مرحبا</Say><Hangup/></Response>
 */
export function twiml(instructions: readonly CallInstruction[]): string {
  const verbs = instructions.map((step) => {
    switch (step.kind) {
      case "say": {
        return `<Say${attributes({ language: step.speech.language, voice: step.speech.voice })}>${escape(step.text)}</Say>`;
      }
      case "play": {
        return `<Play>${escape(step.url)}</Play>`;
      }
      case "listen": {
        return `<Gather${attributes({
          input: "speech",
          language: step.speech.language,
          action: step.actionUrl,
          method: "POST",
          timeout: step.timeoutSeconds,
          speechTimeout: "auto",
          hints: step.hints?.join(","),
        })}/>`;
      }
      case "handover": {
        return `<Dial${attributes({ callerId: step.callerId, timeout: step.timeoutSeconds })}>${escape(step.to)}</Dial>`;
      }
      case "hang_up": {
        return "<Hangup/>";
      }
      default: {
        step satisfies never;
        throw new TypeError("twiml: unknown call instruction kind");
      }
    }
  });
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${verbs.join("")}</Response>`;
}
