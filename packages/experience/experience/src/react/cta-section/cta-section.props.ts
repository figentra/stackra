/**
 * Stackra file contract:
 * Purpose: `CtaSectionProps`, what a page hands the CtaSection block: the headline, its actions or a newsletter form.
 * Boundary: an interface in its own file beside the component (ADR 0305). Copy, links and the newsletter's words are
 *           page content; the block hard-codes none of them.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`).
 */

/**
 * A call to action: buttons, a newsletter sign-up, or both.
 *
 * @example
 * <CtaSection title="Open your shop today" actions={[{ id: "start", label: "Start free" }]} onAction={go} />
 */
export interface CtaSectionProps {
  readonly title: string;
  readonly description?: string | undefined;
  /** The buttons; the first is primary. */
  readonly actions?:
    | readonly { readonly id: string; readonly label: string; readonly href?: string | undefined }[]
    | undefined;
  readonly onAction?: ((actionId: string) => void) | undefined;
  /** A newsletter form instead of (or beside) the actions; `onSubscribe` gets the address. */
  readonly newsletter?:
    | {
        readonly label: string;
        readonly placeholder?: string | undefined;
        readonly submit: string;
        /** Under the form: "We send one email a month." */
        readonly note?: string | undefined;
        /** Replaces the form once subscribed. */
        readonly thanks: string;
      }
    | undefined;
  readonly onSubscribe?: ((email: string) => void) | undefined;
  readonly className?: string | undefined;
}
