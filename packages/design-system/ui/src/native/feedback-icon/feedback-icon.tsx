/**
 * Stackra file contract:
 * Purpose: draws the icon of a message on native: the one the caller gave, or the tone's own from `FEEDBACK_BY_TONE`
 *          (info, circle-check, triangle-alert, circle-alert), at 16 pt in the tone's theme colour, so an Alert's and a
 *          Toast's indicator colours itself by tone.
 * Boundary: internal, not in the `native` barrel; Alert and Toast import it by path. The tone colour is set here
 *           because a native icon does not inherit the colour of its holder. The four tone icons are registered here,
 *           not in the app's registry, so a message shows its icon with nothing registered; an app's own icon of the
 *           same name is shadowed only inside a message.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 10); ADR 0312 (decision 3); WCAG 2.2 SC 1.4.1.
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/native";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "@stackra/icons/native/lucide-icons";
import type { ReactNode } from "react";

import type { Tone } from "#contracts/enums/tone.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";
import { Icon } from "#native/icon/icon";

/** The icons a message draws on its own, one per default icon name of `FEEDBACK_BY_TONE`. */
const FEEDBACK_ICONS = defineIconRegistry({
  info: Info,
  "circle-check": CircleCheck,
  "triangle-alert": TriangleAlert,
  "circle-alert": CircleAlert,
});

/** Props of FeedbackIcon. */
export interface FeedbackIconProps {
  /** The tone of the message, which picks the default icon and its colour. */
  readonly tone: Tone;
  /** The caller's icon: a name or an element. Left out, the tone's icon is drawn. */
  readonly icon?: IconSlot | undefined;
}

/** Draws a message's icon: an element as given, a name or the tone's default through `Icon` at 16 pt in the tone's colour. */
export function FeedbackIcon({ tone, icon }: FeedbackIconProps): ReactNode {
  if (icon !== undefined && typeof icon !== "string") return icon;
  return (
    <IconRegistryProvider registry={FEEDBACK_ICONS}>
      <Icon name={icon ?? FEEDBACK_BY_TONE[tone].icon} size="sm" tone={tone} />
    </IconRegistryProvider>
  );
}
