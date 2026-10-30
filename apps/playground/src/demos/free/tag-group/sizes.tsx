/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the web Tag group: Each size on the page’s own surface and on a tinted card, where the
 *          surface variant reads better.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { Size, TagVariant } from "@stackra/ui/contracts";
import { Surface, TagGroup as UiTagGroup, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TAG_GROUP_KEYS } from "#src/demos/free/tag-group/tag-group-keys.constant";

/** The demo's keys. */
const K = TAG_GROUP_KEYS.tag_group;

/** Tag group: Sizes and surfaces. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  /** The tags of most samples. */
  const TOPICS = [
    { id: "news", label: t(K.sample.news) },
    { id: "travel", label: t(K.sample.travel) },
    { id: "gaming", label: t(K.sample.gaming) },
    { id: "music", label: t(K.sample.music) },
  ] as const;
  return (
    <>
      {TagVariant.map((variant) => (
        <Surface
          key={variant}
          variant={variant === "surface" ? "secondary" : "default"}
          className="grid gap-4 p-4"
        >
          {Size.map((size) => (
            <UiTagGroup
              key={size}
              items={TOPICS}
              size={size}
              variant={variant}
              label={t(K.size, { size, variant })}
              selectionMode="multiple"
              defaultValue={["news"]}
            />
          ))}
        </Surface>
      ))}
    </>
  );
}
