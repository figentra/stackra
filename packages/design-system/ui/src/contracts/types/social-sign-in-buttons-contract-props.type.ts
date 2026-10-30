/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SocialSignInButtons` takes: a stack of "Continue with …" buttons, one per provider, or a row of mark-only buttons, with one provider busy at a time.
 * Boundary: types only. The sign-in flow (OAuth, the system sheet) is the app's, in `onSignIn`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { Orientation } from "#contracts/enums/orientation.enum";
import type { SocialProvider } from "#contracts/types/social-provider.type";

/** Props shared by the web and native `SocialSignInButtons`. */
export interface SocialSignInButtonsContractProps {
  /** The providers, in the order shown. */
  readonly providers: readonly SocialProvider[];
  /** Called with the provider's id when its button is pressed. */
  readonly onSignIn?: ((id: string) => void) | undefined;
  /** `vertical` stacks full-width buttons with words; `horizontal` is a row of mark-only buttons. Defaults to `vertical`. */
  readonly orientation?: Orientation | undefined;
  /** The provider whose sign-in runs: its button shows a spinner and every button refuses presses. */
  readonly pendingId?: string | undefined;
  /** The words of a button. Defaults to the catalogue's "Continue with {provider}". */
  readonly labelOf?: ((provider: SocialProvider) => string) | undefined;
  /** True to refuse every button. */
  readonly isDisabled?: boolean | undefined;
}
