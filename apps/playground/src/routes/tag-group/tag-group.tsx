/**
 * Stackra file contract:
 * Purpose: the page of the tag group route: the group with a label, with a description and with only an accessible
 *          name, every size by both surfaces, no selection, one and several, every state (disabled tag, disabled group,
 *          read-only, required, invalid, empty) and a live example whose tags can be selected and removed and brought
 *          back, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { Size, TagVariant } from "@stackra/ui/contracts";
import { Button, Heading, Surface, TagGroup as UiTagGroup, Text } from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { TagGroupRoute } from "#src/routes/tag-group/tag-group.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::tag-group.*` keys.
const STRINGS = {
  documentTitle: `${TagGroupRoute.title} · Stackra Playground`,
  intro:
    "A tag group is a row of short tags that can be selected, removed, or just read. The value is the list of selected keys; removing a tag is the page's job, which drops it from the list. For a static label use a chip.",
  basics: "Basics",
  basicsNote:
    "A visible label, a label with a description, and a group with no visible label that is named for assistive technology.",
  topicsLabel: "Topics",
  describedLabel: "Amenities",
  description: "Shown on the listing page.",
  hiddenLabelName: "Post tags",
  sizes: "Sizes and surfaces",
  sizesNote:
    "Each size on the page's own surface and on a tinted card, where the surface variant reads better.",
  size: (size: string, variant: string) => `Size ${size}, ${variant}`,
  selection: "Selection",
  selectionNote:
    "None is a plain list of tags. One keeps a single tag selected; several toggles each tag.",
  none: "No selection",
  single: "One selected",
  multiple: "Several selected",
  states: "States",
  statesNote:
    "A disabled tag is shown but refused, and a disabled group refuses them all. Read-only keeps the selection and hides the remove buttons.",
  disabledTag: "One disabled tag",
  disabledGroup: "Disabled group",
  readOnly: "Read-only",
  required: "Required",
  invalid: "Invalid",
  invalidError: "Choose at least one topic.",
  empty: "Empty",
  emptyMessage: "No filters applied.",
  live: "Try it",
  liveNote:
    "Select tags and remove them with their buttons; the page reports both. Restore brings the removed tags back.",
  liveLabel: "Filters",
  remove: (tag: string) => `Remove ${tag}`,
  restore: "Restore the tags",
  selected: (keys: readonly string[]) =>
    `Selected: ${keys.length === 0 ? "none" : keys.join(", ")}`,
  removed: (keys: readonly string[]) => `Removed: ${keys.length === 0 ? "none" : keys.join(", ")}`,
} as const;

/** The tags of most samples. */
const TOPICS = [
  { id: "news", label: "News" },
  { id: "travel", label: "Travel" },
  { id: "gaming", label: "Gaming" },
  { id: "music", label: "Music" },
] as const;

/** The same tags with one refused. */
const TOPICS_ONE_DISABLED = [
  { id: "news", label: "News" },
  { id: "travel", label: "Travel", isDisabled: true },
  { id: "gaming", label: "Gaming" },
] as const;

/** The tags of the amenities sample. */
const AMENITIES = [
  { id: "laundry", label: "Laundry" },
  { id: "fitness", label: "Fitness centre" },
  { id: "parking", label: "Parking" },
  { id: "pool", label: "Swimming pool" },
] as const;

/** The tags of the live example, in the order they come back in. */
const FILTERS = [
  { id: "open", label: "Open" },
  { id: "mine", label: "Assigned to me" },
  { id: "urgent", label: "Urgent" },
  { id: "recent", label: "Recent" },
] as const;

/** The grid that lays the samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-8";

/** The TagGroup page. */
export function TagGroup() {
  const [tags, setTags] = useState<readonly (typeof FILTERS)[number][]>(FILTERS);
  const [picked, setPicked] = useState<readonly string[]>(["open"]);
  const [removedKeys, setRemovedKeys] = useState<readonly string[]>([]);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{TagGroupRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="tag-group-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <div className={ROW}>
          <UiTagGroup items={TOPICS} label={STRINGS.topicsLabel} />
          <UiTagGroup
            items={AMENITIES}
            label={STRINGS.describedLabel}
            description={STRINGS.description}
          />
          <UiTagGroup items={TOPICS} aria-label={STRINGS.hiddenLabelName} />
        </div>
      </PageSection>

      <PageSection id="tag-group-sizes" title={STRINGS.sizes} note={STRINGS.sizesNote}>
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
                label={STRINGS.size(size, variant)}
                selectionMode="multiple"
                defaultValue={["news"]}
              />
            ))}
          </Surface>
        ))}
      </PageSection>

      <PageSection id="tag-group-selection" title={STRINGS.selection} note={STRINGS.selectionNote}>
        <div className={ROW}>
          <UiTagGroup items={TOPICS} label={STRINGS.none} />
          <UiTagGroup
            items={TOPICS}
            label={STRINGS.single}
            selectionMode="single"
            defaultValue={["travel"]}
          />
          <UiTagGroup
            items={TOPICS}
            label={STRINGS.multiple}
            selectionMode="multiple"
            defaultValue={["news", "music"]}
          />
        </div>
      </PageSection>

      <PageSection id="tag-group-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={ROW}>
          <UiTagGroup
            items={TOPICS_ONE_DISABLED}
            label={STRINGS.disabledTag}
            selectionMode="multiple"
          />
          <UiTagGroup
            items={TOPICS}
            label={STRINGS.disabledGroup}
            selectionMode="multiple"
            defaultValue={["news"]}
            isDisabled
          />
          <UiTagGroup
            items={TOPICS}
            label={STRINGS.readOnly}
            selectionMode="multiple"
            defaultValue={["news"]}
            isReadOnly
            onRemove={() => undefined}
            removeLabel={STRINGS.remove}
          />
          <UiTagGroup items={TOPICS} label={STRINGS.required} selectionMode="multiple" isRequired />
          <UiTagGroup
            items={TOPICS}
            label={STRINGS.invalid}
            selectionMode="multiple"
            isInvalid
            errorMessage={STRINGS.invalidError}
          />
          <UiTagGroup items={[]} label={STRINGS.empty} emptyMessage={STRINGS.emptyMessage} />
        </div>
      </PageSection>

      <PageSection id="tag-group-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <UiTagGroup
          items={tags}
          label={STRINGS.liveLabel}
          selectionMode="multiple"
          value={picked}
          onChange={setPicked}
          onRemove={(keys) => {
            setTags((current) => current.filter((tag) => !keys.includes(tag.id)));
            setPicked((current) => current.filter((key) => !keys.includes(key)));
            setRemovedKeys((current) => [...current, ...keys]);
          }}
          removeLabel={STRINGS.remove}
        />
        <Text role="status" data-testid="tag-group-selected" tone="muted">
          {STRINGS.selected(picked)}
        </Text>
        <Text data-testid="tag-group-removed" tone="muted">
          {STRINGS.removed(removedKeys)}
        </Text>
        <div>
          <Button
            variant="secondary"
            onPress={() => {
              setTags(FILTERS);
              setRemovedKeys([]);
            }}
          >
            {STRINGS.restore}
          </Button>
        </div>
      </PageSection>
    </article>
  );
}
