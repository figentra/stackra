/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `TagGroup` (@stackra/ui): a labelled, a described and an
 *          unlabelled group, each size on the page and on a tinted card, the three selection modes, each state, and
 *          a live group whose tags are selected, removed and restored.
 * Boundary: presentation and local demo state only; the group is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Size, TagVariant, type TagItem } from "@stackra/ui/contracts";
import { Button, Surface, TagGroup, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description:
      "A visible label, a label with a description, and a group with no visible label that is named by `accessibilityLabel`.",
    topics: "Topics",
    amenities: "Amenities",
    hint: "Shown on the listing page.",
    hiddenName: "Post tags",
  },
  sizes: {
    title: "Sizes and surfaces",
    description:
      "Each `size`, with `variant` `default` on the page and `surface` on a tinted card.",
    size: (size: string, variant: string) => `Size ${size}, ${variant}`,
  },
  selection: {
    title: "Selection",
    description:
      "`none` is a plain list of tags. `single` keeps one tag selected; `multiple` toggles each tag.",
    none: "No selection",
    single: "One selected",
    multiple: "Several selected",
  },
  states: {
    title: "States",
    description:
      "A disabled tag is shown but refused, and a disabled group refuses them all. Read-only keeps the selection and hides the remove buttons.",
    disabledTag: "One disabled tag",
    disabledGroup: "Disabled group",
    readOnly: "Read-only",
    required: "Required",
    invalid: "Invalid",
    invalidError: "Choose at least one topic.",
    empty: "Empty",
    emptyMessage: "No filters applied.",
  },
  live: {
    title: "Try it",
    description:
      "Select tags and remove them with their buttons; the page reports both. Restore brings the removed tags back.",
    label: "Filters",
    remove: (tag: string) => `Remove ${tag}`,
    restore: "Restore the tags",
    selected: (keys: readonly string[]) =>
      `Selected: ${keys.length === 0 ? "none" : keys.join(", ")}`,
    removed: (keys: readonly string[]) =>
      `Removed: ${keys.length === 0 ? "none" : keys.join(", ")}`,
  },
} as const;

/** The tags most samples show. */
const TOPICS: readonly TagItem[] = [
  { id: "news", label: "News" },
  { id: "travel", label: "Travel" },
  { id: "gaming", label: "Gaming" },
  { id: "music", label: "Music" },
];

/** The same tags with one refused. */
const TOPICS_ONE_DISABLED: readonly TagItem[] = [
  { id: "news", label: "News" },
  { id: "travel", label: "Travel", isDisabled: true },
  { id: "gaming", label: "Gaming" },
];

/** The tags of the amenities sample. */
const AMENITIES: readonly TagItem[] = [
  { id: "laundry", label: "Laundry" },
  { id: "fitness", label: "Fitness centre" },
  { id: "parking", label: "Parking" },
  { id: "pool", label: "Swimming pool" },
];

/** The tags of the live example, in the order they come back in. */
const FILTERS: readonly TagItem[] = [
  { id: "open", label: "Open" },
  { id: "mine", label: "Assigned to me" },
  { id: "urgent", label: "Urgent" },
  { id: "recent", label: "Recent" },
];

/** The live group: selectable and removable, with a readout and a restore button. */
function LiveTagGroup() {
  const [removed, setRemoved] = useState<readonly string[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const shown = FILTERS.filter((tag) => !removed.includes(tag.id));

  return (
    <>
      <TagGroup
        label={STRINGS.live.label}
        items={shown}
        selectionMode="multiple"
        value={selected}
        onChange={setSelected}
        onRemove={(keys) => {
          setRemoved((list) => [...list, ...keys]);
          setSelected((list) => list.filter((key) => !keys.includes(key)));
        }}
        removeLabel={STRINGS.live.remove}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {STRINGS.live.selected(selected)}
      </Text>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {STRINGS.live.removed(removed)}
      </Text>
      <Button
        size="sm"
        variant="secondary"
        isDisabled={removed.length === 0}
        onPress={() => setRemoved([])}
      >
        {STRINGS.live.restore}
      </Button>
    </>
  );
}

/** The TagGroup page: one section per option, in a scrollable screen. */
export function TagGroupScreen() {
  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <TagGroup label={STRINGS.basics.topics} items={TOPICS} />
        <TagGroup
          label={STRINGS.basics.amenities}
          description={STRINGS.basics.hint}
          items={AMENITIES}
        />
        <TagGroup accessibilityLabel={STRINGS.basics.hiddenName} items={TOPICS} />
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        {Size.map((size) =>
          TagVariant.map((variant) =>
            variant === "surface" ? (
              <Surface key={`${size}-${variant}`} variant="secondary">
                <Sample caption={STRINGS.sizes.size(size, variant)}>
                  <TagGroup items={TOPICS} size={size} variant={variant} />
                </Sample>
              </Surface>
            ) : (
              <Sample key={`${size}-${variant}`} caption={STRINGS.sizes.size(size, variant)}>
                <TagGroup items={TOPICS} size={size} variant={variant} />
              </Sample>
            ),
          ),
        )}
      </Section>

      <Section title={STRINGS.selection.title} description={STRINGS.selection.description}>
        <TagGroup label={STRINGS.selection.none} items={TOPICS} selectionMode="none" />
        <TagGroup
          label={STRINGS.selection.single}
          items={TOPICS}
          selectionMode="single"
          defaultValue={["news"]}
        />
        <TagGroup
          label={STRINGS.selection.multiple}
          items={TOPICS}
          selectionMode="multiple"
          defaultValue={["news", "music"]}
        />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <TagGroup
          label={STRINGS.states.disabledTag}
          items={TOPICS_ONE_DISABLED}
          selectionMode="multiple"
        />
        <TagGroup
          label={STRINGS.states.disabledGroup}
          items={TOPICS}
          selectionMode="multiple"
          isDisabled
        />
        <TagGroup
          label={STRINGS.states.readOnly}
          items={TOPICS}
          selectionMode="multiple"
          defaultValue={["travel"]}
          isReadOnly
          onRemove={() => undefined}
          removeLabel={STRINGS.live.remove}
        />
        <TagGroup
          label={STRINGS.states.required}
          items={TOPICS}
          selectionMode="multiple"
          isRequired
        />
        <TagGroup
          label={STRINGS.states.invalid}
          items={TOPICS}
          selectionMode="multiple"
          isInvalid
          errorMessage={STRINGS.states.invalidError}
        />
        <TagGroup
          label={STRINGS.states.empty}
          items={[]}
          emptyMessage={STRINGS.states.emptyMessage}
        />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <LiveTagGroup />
      </Section>
    </Screen>
  );
}
