/**
 * Stackra file contract:
 * Purpose: the props the web `ChatMessage` parts take from the shared vocabulary: the accessible name of an
 *          icon-only message action.
 * Boundary: types only; web only. Every other prop (`tooltip`, the avatar's `alt` and `show`, the div props) is
 *          HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of `ChatMessage.Action` that the Stackra vocabulary names. */
export interface ChatMessageActionContractProps {
  /** The accessible name of the icon-only action button; HeroUI Pro's `aria-label`, which it has no default for. */
  readonly label: string;
}
