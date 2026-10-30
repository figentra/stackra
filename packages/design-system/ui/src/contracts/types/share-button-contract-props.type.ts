/**
 * Stackra file contract:
 * Purpose: `ShareButtonContractProps`, the props every runtime's `ShareButton` takes: what to share (a link, a title, a
 *          line of text), the button's look and what happened.
 * Boundary: types only; the system share sheet is the platform's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave C).
 */
import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { Size } from "#contracts/enums/size.enum";

/** Props shared by the web and native `ShareButton`. */
export interface ShareButtonContractProps {
  /** The link to share, for example a product page. */
  readonly url?: string | undefined;
  /** The title the share sheet shows, for example the product's name. */
  readonly title?: string | undefined;
  /** A line shared with the link, for example "Look at this abaya". */
  readonly text?: string | undefined;
  /** The button's words and accessible name. Defaults to the catalogue's "Share". */
  readonly label?: string | undefined;
  /** True to draw only the share icon, named by `label`. */
  readonly isIconOnly?: boolean | undefined;
  /** The button's emphasis. Defaults to `secondary`, or `ghost` when icon only. */
  readonly variant?: ButtonVariant | undefined;
  /** The button's size. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** True to show the button but refuse sharing. */
  readonly isDisabled?: boolean | undefined;
  /**
   * Called once something was shared: `shared` through the system share sheet, `copied` when the browser has none and
   * the link was copied instead (web only). Never called when the person closes the sheet.
   */
  readonly onShare?: ((outcome: "shared" | "copied") => void) | undefined;
}
