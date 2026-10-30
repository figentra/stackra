/**
 * Stackra file contract:
 * Purpose: the "blur-up" demo of the web Thumbnail: a blurred placeholder, then the photo fading in; load it again to replay.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); design-system gap inventory row 12.
 */
import { Button, Thumbnail, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { THUMBNAIL_KEYS } from "#src/demos/free/thumbnail/thumbnail-keys.constant";

/** The demo's keys. */
const K = THUMBNAIL_KEYS.thumbnail;

/** A flat drawing of a cup, inline, so the page and its e2e suite never touch the network. */
const PRODUCT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#d6c3a5"/><path d="M20 22h24l-3 28H23z" fill="#6b4f3a"/><rect x="18" y="18" width="28" height="5" fill="#3f2e22"/></svg>',
)}`;

/** A 4-pixel version of the same picture, as an image service would send first. */
const TINY = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><rect width="4" height="4" fill="#d6c3a5"/><rect x="1" y="1" width="2" height="3" fill="#6b4f3a"/></svg>',
)}`;

/** Thumbnail: Blur-up. */
export default function BlurUp() {
  const t = useCatalogueText(MESSAGES.en);
  const [round, setRound] = useState(0);
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* A new key remounts the thumbnail, so the fade plays again. */}
      <Thumbnail key={round} size="lg" src={PRODUCT} placeholderSrc={TINY} alt={t(K.latte)} />
      <Button variant="secondary" onPress={() => setRound((value) => value + 1)}>
        {t(K.reload)}
      </Button>
    </div>
  );
}
