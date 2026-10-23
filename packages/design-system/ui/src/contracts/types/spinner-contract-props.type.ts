/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Spinner` takes: its size, its tone and the accessible name that makes it a
 *          spoken status instead of a decoration. Each runtime's `SpinnerProps` is this plus its HeroUI spinner's own
 *          props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7: props vocabulary);
 *          ADR 0304; ADR 0165 (UI contract).
 */
import type { Size } from "#contracts/enums/size.enum";
import type { TextTone } from "#contracts/enums/text-tone.enum";

/** Props shared by the web and native `Spinner`. */
export interface SpinnerContractProps {
  /** The diameter: `sm` 16, `md` 24 or `lg` 32 pixels on both runtimes. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** The colour role it spins in; `default` is the foreground colour. Defaults to `accent`, as in HeroUI. */
  readonly tone?: TextTone | undefined;
  /**
   * The spoken name, for example "Loading orders". Given, the spinner is announced as a status; left out, it is
   * hidden from screen readers, so text beside it must say what is loading.
   */
  readonly label?: string | undefined;
}
