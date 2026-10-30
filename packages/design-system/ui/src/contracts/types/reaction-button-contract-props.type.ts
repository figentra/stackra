/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ReactionButton` takes: an emoji with a count that the user toggles.
 * Boundary: types only. Controlled (`isSelected`): the count is the caller's. Uncontrolled (`defaultSelected`): the
 *           button adds or removes the user's own 1 from `count` as it toggles.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */

/** Props shared by the web and native `ReactionButton`. */
export interface ReactionButtonContractProps {
  /** The emoji drawn on the button. */
  readonly emoji: string;
  /** How many reacted, the user included when selected (at first, when uncontrolled). */
  readonly count: number;
  /** True when the user has reacted; set it to control the state (the count is then shown as given). */
  readonly isSelected?: boolean | undefined;
  /** The first state when uncontrolled; toggling adds or removes the user's 1 from `count`. */
  readonly defaultSelected?: boolean | undefined;
  /** Called with the new state when pressed. */
  readonly onChange?: ((isSelected: boolean) => void) | undefined;
  /** The emoji's name, read with the count (for example "thumbs up"). */
  readonly label?: string | undefined;
  /** True to refuse presses. */
  readonly isDisabled?: boolean | undefined;
}
