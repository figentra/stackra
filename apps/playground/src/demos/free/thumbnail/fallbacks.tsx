/**
 * Stackra file contract:
 * Purpose: the "fallbacks" demo of the web Thumbnail: no image, a broken image and a named one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); design-system gap inventory row 12.
 */
import { Thumbnail, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { THUMBNAIL_KEYS } from "#src/demos/free/thumbnail/thumbnail-keys.constant";

/** The demo's keys. */
const K = THUMBNAIL_KEYS.thumbnail;

/** A flat drawing of a cup, inline, so the page and its e2e suite never touch the network. */
const PRODUCT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#d6c3a5"/><path d="M20 22h24l-3 28H23z" fill="#6b4f3a"/><rect x="18" y="18" width="28" height="5" fill="#3f2e22"/></svg>',
)}`;

/** The Thumbnail demo: fallbacks. */
export default function Fallbacks() {
  const t = useCatalogueText(MESSAGES.en);
  const samples = [
    { id: "empty", caption: t(K.empty), node: <Thumbnail /> },
    { id: "broken", caption: t(K.broken), node: <Thumbnail src="/missing-product.jpg" /> },
    { id: "named", caption: t(K.named), node: <Thumbnail src={PRODUCT} alt={t(K.latte)} /> },
  ];
  return (
    <ul className="flex flex-wrap gap-4">
      {samples.map(({ id, caption, node }) => (
        <li key={id} className="grid justify-items-center gap-1">
          {node}
          <span className="text-xs text-muted">{caption}</span>
        </li>
      ))}
    </ul>
  );
}
