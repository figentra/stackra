/**
 * Stackra file contract:
 * Purpose: draws the icon of a message on native: the one the caller gave, or the tone's own from `FEEDBACK_BY_TONE`
 *          (info, circle-check, triangle-alert, circle-alert), at 16 pt in the tone's theme colour, so an Alert's and a
 *          Toast's indicator colours itself by tone.
 * Boundary: internal, not in the `native` barrel; Alert and Toast import it by path. The tone colour is set here
 *           because a native icon does not inherit the colour of its holder. The four tone icons come from `Icon`'s own
 *           registry (`UI_ICONS`), so a message shows its icon with nothing registered and an app's own icon of the
 *           same name still wins, here as in AlertDialog.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 10); ADR 0312 (decision 3); WCAG 2.2 SC 1.4.1.
 */
import type { ReactNode } from "react";

import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";
import { Icon } from "#native/icon/icon";
import type { FeedbackIconProps } from "#native/feedback-icon/feedback-icon.props";

/** Draws a message's icon: an element as given, a name or the tone's default through `Icon` at 16 pt in the tone's colour. */
export function FeedbackIcon({ tone, icon }: FeedbackIconProps): ReactNode {
  if (icon !== undefined && typeof icon !== "string") return icon;
  return <Icon name={icon ?? FEEDBACK_BY_TONE[tone].icon} size="sm" tone={tone} />;
}
