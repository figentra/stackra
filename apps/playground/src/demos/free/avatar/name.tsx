/**
 * Stackra file contract:
 * Purpose: the "name" demo of the web Avatar: A standalone avatar carries a label. In a list row the visible name is
 *          enough, so the avatar is decorative.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Avatar as UiAvatar, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_KEYS } from "#src/demos/free/avatar/avatar-keys.constant";

/** The demo's keys. */
const K = AVATAR_KEYS.avatar;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Avatar: Accessible name. */
export default function Name() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      <UiAvatar name={t(K.standalone)} label={t(K.row)} data-sample="labelled" />
      <ul aria-label={t(K.accessible_name)}>
        <li className="flex items-center gap-2" data-sample="row">
          <UiAvatar name={t(K.row_name)} />
          <span className="grid">
            <span>{t(K.row_name)}</span>
            <Text tone="muted" type="small">
              {t(K.row_role)}
            </Text>
          </span>
        </li>
      </ul>
    </div>
  );
}
