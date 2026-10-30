/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Tag group: A disabled tag is shown but refused, and a disabled group refuses
 *          them all. Read-only keeps the selection and hides the remove buttons.
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

/** Tag group: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  /** The tags of most samples. */
  const TOPICS = [
    { id: "news", label: t(K.sample.news) },
    { id: "travel", label: t(K.sample.travel) },
    { id: "gaming", label: t(K.sample.gaming) },
    { id: "music", label: t(K.sample.music) },
  ] as const;
  /** The same tags with one refused. */
  const TOPICS_ONE_DISABLED = [
    { id: "news", label: t(K.sample.news) },
    { id: "travel", label: t(K.sample.travel), isDisabled: true },
    { id: "gaming", label: t(K.sample.gaming) },
  ] as const;
  return (
    <div className={ROW}>
      <UiTagGroup items={TOPICS_ONE_DISABLED} label={t(K.disabled_tag)} selectionMode="multiple" />
      <UiTagGroup
        items={TOPICS}
        label={t(K.disabled_group)}
        selectionMode="multiple"
        defaultValue={["news"]}
        isDisabled
      />
      <UiTagGroup
        items={TOPICS}
        label={t(K.read_only)}
        selectionMode="multiple"
        defaultValue={["news"]}
        isReadOnly
        onRemove={() => undefined}
        removeLabel={(tag) => t(K.remove, { tag })}
      />
      <UiTagGroup items={TOPICS} label={t(K.required)} selectionMode="multiple" isRequired />
      <UiTagGroup
        items={TOPICS}
        label={t(K.invalid)}
        selectionMode="multiple"
        isInvalid
        errorMessage={t(K.invalid_error)}
      />
      <UiTagGroup items={[]} label={t(K.empty)} emptyMessage={t(K.empty_message)} />
    </div>
  );
}
