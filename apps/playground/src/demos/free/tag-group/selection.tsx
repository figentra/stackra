/**
 * Stackra file contract:
 * Purpose: the "selection" demo of the web Tag group: None is a plain list of tags. One keeps a single tag selected;
 *          several toggles each tag.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { TagGroup as UiTagGroup, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TAG_GROUP_KEYS } from "#src/demos/free/tag-group/tag-group-keys.constant";

/** The demo's keys. */
const K = TAG_GROUP_KEYS.tag_group;

/** The grid that lays the samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-8";

/** Tag group: Selection. */
export default function Selection() {
  const t = useCatalogueText(MESSAGES.en);
  /** The tags of most samples. */
  const TOPICS = [
    { id: "news", label: t(K.sample.news) },
    { id: "travel", label: t(K.sample.travel) },
    { id: "gaming", label: t(K.sample.gaming) },
    { id: "music", label: t(K.sample.music) },
  ] as const;
  return (
    <div className={ROW}>
      <UiTagGroup items={TOPICS} label={t(K.none)} />
      <UiTagGroup
        items={TOPICS}
        label={t(K.single)}
        selectionMode="single"
        defaultValue={["travel"]}
      />
      <UiTagGroup
        items={TOPICS}
        label={t(K.multiple)}
        selectionMode="multiple"
        defaultValue={["news", "music"]}
      />
    </div>
  );
}
