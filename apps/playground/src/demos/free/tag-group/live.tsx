/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Tag group: Select tags and remove them with their buttons; the page reports
 *          both. Restore brings the removed tags back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { Button, TagGroup as UiTagGroup, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TAG_GROUP_KEYS } from "#src/demos/free/tag-group/tag-group-keys.constant";

/** The demo's keys. */
const K = TAG_GROUP_KEYS.tag_group;

/** Tag group: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The tags of the live example, in the order they come back in. */
  const FILTERS = [
    { id: "open", label: t(K.sample.open) },
    { id: "mine", label: t(K.sample.assigned_to_me) },
    { id: "urgent", label: t(K.sample.urgent) },
    { id: "recent", label: t(K.sample.recent) },
  ] as const;
  const [tags, setTags] = useState<readonly (typeof FILTERS)[number][]>(FILTERS);

  const [picked, setPicked] = useState<readonly string[]>(["open"]);

  const [removedKeys, setRemovedKeys] = useState<readonly string[]>([]);

  return (
    <div className="grid gap-6">
      <UiTagGroup
        items={tags}
        label={t(K.live_label)}
        selectionMode="multiple"
        value={picked}
        onChange={setPicked}
        onRemove={(keys) => {
          setTags((current) => current.filter((tag) => !keys.includes(tag.id)));
          setPicked((current) => current.filter((key) => !keys.includes(key)));
          setRemovedKeys((current) => [...current, ...keys]);
        }}
        removeLabel={(tag) => t(K.remove, { tag })}
      />
      <Text role="status" data-testid="tag-group-selected" tone="muted">
        {t(K.selected, { keys: picked.join(", ") || "none" })}
      </Text>
      <Text data-testid="tag-group-removed" tone="muted">
        {t(K.removed, { keys: removedKeys.join(", ") || "none" })}
      </Text>
      <div>
        <Button
          variant="secondary"
          onPress={() => {
            setTags(FILTERS);
            setRemovedKeys([]);
          }}
        >
          {t(K.restore)}
        </Button>
      </div>
    </div>
  );
}
