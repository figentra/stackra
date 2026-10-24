/**
 * Stackra file contract:
 * Purpose: the one colour role of the platform: the `tone` of a component and of an enum case
 *          (`[code, { tone: Tone.Success }]`) a badge or a chip draws.
 * Boundary: an `Enum.of` value plus the type of the same name. There is one `Tone`; `@stackra/ui/contracts` uses it.
 *           A role is a theme token name, never a colour.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 7: the five tones), ADR 0127 2026-10-24 note (one Tone, in contracts), ADR
 *                     0231 (snake_case codes).
 */
import { Enum } from "#core/bases/enum.base";

/** The five tones of ADR 0303; there is no `info` (use `Accent`). */
export const Tone = Enum.of({
  /** Neutral. */
  Default: "default",
  /** The brand accent; also the informational tone. */
  Accent: "accent",
  /** Done, healthy, paid. */
  Success: "success",
  /** Needs attention soon. */
  Warning: "warning",
  /** Failed, destructive, refused. */
  Danger: "danger",
});

/** One of the codes above. */
export type Tone = Enum.Value<typeof Tone>;
