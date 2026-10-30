/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web Badge: A row per variant, an anchor per tone, each badge labelled for a
 *          screen reader.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Enum, Tone } from "@stackra/contracts";
import { BadgeVariant } from "@stackra/ui/contracts";
import { Badge as UiBadge, Heading, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BADGE_KEYS } from "#src/demos/free/badge/badge-keys.constant";

/** The demo's keys. */
const K = BADGE_KEYS.badge;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/**
 * A plain disc standing in for an avatar: a neutral fill the dots are measured against. It holds no text, because a
 * badge overlaps the disc's corner and a text there would have an undeterminable background to a contrast check.
 */
function Disc() {
  return <span aria-hidden="true" className="inline-flex size-10 bg-default" />;
}

/** Badge: Variants and tones. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <>
      {BadgeVariant.map((variant) => (
        <div key={variant} className="grid gap-2">
          <Heading level={3}>{variant}</Heading>
          <ul className={ROW}>
            {Enum.values(Tone).map((tone) => (
              <li key={tone}>
                <UiBadge.Anchor>
                  <Disc />
                  <UiBadge
                    tone={tone}
                    variant={variant}
                    label={t(K.variant_label, { tone, variant })}
                  >
                    {5}
                  </UiBadge>
                </UiBadge.Anchor>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
