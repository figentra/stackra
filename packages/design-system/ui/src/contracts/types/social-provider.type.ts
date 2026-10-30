/**
 * Stackra file contract:
 * Purpose: `SocialProvider`, one sign-in provider of SocialSignInButtons: its key, name and mark.
 * Boundary: types only. A custom `icon` wins; else the built-in mark of `provider` (or of `id` when it names one);
 *           else a neutral letter mark.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { SocialMark } from "#contracts/enums/social-mark.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One sign-in provider. */
export interface SocialProvider {
  /** The key `onSignIn` reports, for example "google". */
  readonly id: string;
  /** The provider's name as its owner writes it, for example "Google"; isolated inside the button's words. */
  readonly name: string;
  /** Which built-in mark to draw. Defaults to `id` when `id` names one ("apple", "google", "microsoft", "x", "facebook", "email"). */
  readonly provider?: SocialMark | undefined;
  /** A custom mark, used under its own brand rules; it wins over the built-in one. A letter mark is drawn without either. */
  readonly icon?: IconSlot | undefined;
}
