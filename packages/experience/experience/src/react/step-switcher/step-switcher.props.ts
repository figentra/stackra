/**
 * Stackra file contract:
 * Purpose: `StepSwitcherProps`, what a page hands the StepSwitcher: the switcher's spoken name and its
 *          steps, each with a title, a line and the code it shows.
 * Boundary: an interface in its own file beside the component (ADR 0305). Every word is page content; the code is
 *           shown as text, never run.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041 (the landing).
 */

/**
 * A step switcher: Action → Endpoint → Client.
 *
 * @example
 * <StepSwitcher label="Write it once" steps={[{ id: "action", label: "Action", title: "…", body: "…",
 *   code: { filename: "cancel-order.action.ts", language: "ts", source: "export class …" } }]} />
 */
export interface StepSwitcherProps {
  /** The spoken name of the step list. */
  readonly label: string;
  /** The steps, in order; the first is shown at the start. */
  readonly steps: readonly {
    readonly id: string;
    /** The step's word in the switcher, and its tab's name. */
    readonly label: string;
    readonly title: string;
    readonly body: string;
    /** The code the step shows in a schematic window titled by `filename`. */
    readonly code: {
      readonly filename: string;
      readonly language: string;
      readonly source: string;
    };
  }[];
  /** Styles the switcher. */
  readonly className?: string | undefined;
}
