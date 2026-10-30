/**
 * Stackra file contract:
 * Purpose: the "levels" demo of the web Separator: Each level on the surface it matches. The transparent surface
 *          pairs with the default level.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { SurfaceVariant, type SeparatorVariant } from "@stackra/ui/contracts";
import { Separator as UiSeparator, Surface, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SEPARATOR_KEYS } from "#src/demos/free/separator/separator-keys.constant";

/** The demo's keys. */
const K = SEPARATOR_KEYS.separator;

/** The padding and radius every surface sample adds, since the web surface has neither. */
const BOX = "p-6";

/** The rule that pairs with each surface level; the transparent surface sits on the page, so it pairs with `default`. */
const RULE_FOR: Readonly<Record<SurfaceVariant, SeparatorVariant>> = {
  default: "default",
  secondary: "secondary",
  tertiary: "tertiary",
  transparent: "default",
};

/** Separator: Levels. */
export default function Levels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SurfaceVariant.map((variant) => (
        <Surface
          key={variant}
          variant={variant}
          className={variant === "transparent" ? `${BOX} border border-border` : BOX}
        >
          <Text>{t(K.level, { level: variant })}</Text>
          <UiSeparator variant={RULE_FOR[variant]} className="my-3" />
          <Text tone="muted">{t(K.level, { level: RULE_FOR[variant] })}</Text>
        </Surface>
      ))}
    </div>
  );
}
