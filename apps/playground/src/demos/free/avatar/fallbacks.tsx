/**
 * Stackra file contract:
 * Purpose: the "fallbacks" demo of the web Avatar: An image, a broken image that falls back to initials, an icon for
 *          an organisation, and no name at all.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Avatar as UiAvatar, Icon, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_KEYS } from "#src/demos/free/avatar/avatar-keys.constant";

/** The demo's keys. */
const K = AVATAR_KEYS.avatar;

/** An abstract shape as an inline image, so the page and its e2e suite never touch the network. */
const SAMPLE_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#64748b"/><circle cx="32" cy="26" r="12" fill="#e2e8f0"/><path d="M8 64a24 24 0 0 1 48 0z" fill="#e2e8f0"/></svg>',
)}`;

/** A path that is not an image, so the avatar falls back to its initials. */
const BROKEN_IMAGE = "/missing-avatar.png";

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Avatar: Fallbacks. */
export default function Fallbacks() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li className="grid justify-items-center gap-2">
        <UiAvatar src={SAMPLE_IMAGE} name={t(K.standalone)} data-sample="loaded" />
        <Text tone="muted" type="small">
          {t(K.loaded)}
        </Text>
      </li>
      <li className="grid justify-items-center gap-2">
        <UiAvatar src={BROKEN_IMAGE} name={t(K.standalone)} data-sample="broken" />
        <Text tone="muted" type="small">
          {t(K.broken)}
        </Text>
      </li>
      <li className="grid justify-items-center gap-2">
        <UiAvatar
          shape="square"
          name={t(K.organisation)}
          fallback={<Icon name="building" />}
          data-sample="organisation"
        />
        <Text tone="muted" type="small">
          {t(K.organisation)}
        </Text>
      </li>
      <li className="grid justify-items-center gap-2">
        <UiAvatar data-sample="anonymous" />
        <Text tone="muted" type="small">
          {t(K.anonymous)}
        </Text>
      </li>
    </ul>
  );
}
