/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the web Avatar: A row per variant: the initials of each tone, whose contrast the e2e
 *          suite measures.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Enum, Tone } from "@stackra/contracts";
import { AvatarVariant } from "@stackra/ui/contracts";
import { Avatar as UiAvatar, Heading, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_KEYS } from "#src/demos/free/avatar/avatar-keys.constant";

/** The demo's keys. */
const K = AVATAR_KEYS.avatar;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Avatar: Tones and variants. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <>
      {AvatarVariant.map((variant) => (
        <div key={variant} className="grid gap-2">
          <Heading level={3}>{t(K.variant, { variant })}</Heading>
          <ul aria-label={t(K.variant, { variant })} className={ROW}>
            {Enum.values(Tone).map((tone) => (
              <li key={tone}>
                <UiAvatar
                  variant={variant}
                  tone={tone}
                  name={t(K.standalone)}
                  data-tone={tone}
                  data-variant={variant}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
