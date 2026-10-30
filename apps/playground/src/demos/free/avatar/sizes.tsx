/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the web Avatar: A row per shape: each size with an image, then with initials.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { AvatarShape, Size } from "@stackra/ui/contracts";
import { Avatar as UiAvatar, Heading, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_KEYS } from "#src/demos/free/avatar/avatar-keys.constant";

/** The demo's keys. */
const K = AVATAR_KEYS.avatar;

/** An abstract shape as an inline image, so the page and its e2e suite never touch the network. */
const SAMPLE_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#64748b"/><circle cx="32" cy="26" r="12" fill="#e2e8f0"/><path d="M8 64a24 24 0 0 1 48 0z" fill="#e2e8f0"/></svg>',
)}`;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Avatar: Sizes and shapes. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <>
      {AvatarShape.map((shape) => (
        <div key={shape} className="grid gap-2">
          <Heading level={3}>{t(K.shape, { shape })}</Heading>
          <ul aria-label={t(K.shape, { shape })} className={ROW}>
            {Size.map((size) => (
              <li key={`${size}-image`}>
                <UiAvatar
                  shape={shape}
                  size={size}
                  src={SAMPLE_IMAGE}
                  name={t(K.with_image)}
                  data-shape={shape}
                  data-size={size}
                />
              </li>
            ))}
            {Size.map((size) => (
              <li key={`${size}-initials`}>
                <UiAvatar
                  shape={shape}
                  size={size}
                  name={t(K.standalone)}
                  data-shape={shape}
                  data-size={size}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
