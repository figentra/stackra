/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Avatar: Step through the names and turn the image on or off.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Avatar as UiAvatar, Button, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_KEYS } from "#src/demos/free/avatar/avatar-keys.constant";

/** The demo's keys. */
const K = AVATAR_KEYS.avatar;

/** An abstract shape as an inline image, so the page and its e2e suite never touch the network. */
const SAMPLE_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#64748b"/><circle cx="32" cy="26" r="12" fill="#e2e8f0"/><path d="M8 64a24 24 0 0 1 48 0z" fill="#e2e8f0"/></svg>',
)}`;

/** The names of the name sample, each beside its initials, and the live sample's cycle. */
const NAMES = [
  { name: "Ada Lovelace", lang: "en" },
  { name: "Plato", lang: "en" },
  { name: "émile zola", lang: "fr" },
  { name: "ليلى أحمد", lang: "ar" },
] as const;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Avatar: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [nameIndex, setNameIndex] = useState(0);

  const [hasImage, setHasImage] = useState(false);

  const current = NAMES[nameIndex] ?? NAMES[0];

  return (
    <div className="grid gap-6">
      <div className={ROW}>
        <Button
          variant="secondary"
          onPress={() => setNameIndex((index) => (index + 1) % NAMES.length)}
        >
          {t(K.next_name)}
        </Button>
        <Button variant="secondary" onPress={() => setHasImage((value) => !value)}>
          {hasImage ? t(K.image_off) : t(K.image_on)}
        </Button>
      </div>
      <div className={ROW}>
        <UiAvatar
          size="lg"
          name={current.name}
          label={t(K.current)}
          {...(hasImage ? { src: SAMPLE_IMAGE } : {})}
        />
        <span lang={current.lang}>{current.name}</span>
      </div>
    </div>
  );
}
