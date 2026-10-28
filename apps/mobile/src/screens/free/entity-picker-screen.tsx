/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `EntityPicker` (@stackra/ui): a field that opens a sheet with a
 *          search over records a pretend server answers a page at a time, picking one record and picking several shown
 *          as removable tags, a slow load and a load that fails, the words of an empty answer, a create-new row, each
 *          state (required, invalid, disabled, read-only), and a live picker whose choice is read out.
 * Boundary: presentation and local demo state only; the picker is @stackra/ui's, nothing here is styled by hand. The
 *          "server" is a function of the search and the cursor over a fixed list, with a delay; its timers only resolve
 *          a promise, so nothing is set on the page after it is gone.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { EntityOption, EntityOptionPage } from "@stackra/ui/contracts";
import { EntityPicker, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  single: {
    title: "One record",
    description:
      "The first search starts when the sheet opens; later ones start when typing pauses. Pressing the chosen record again clears it.",
    label: "Assignee",
    placeholder: "Choose a person",
    loading: "Loading people",
    empty: "No person found.",
    failed: "People could not be loaded. Type to try again.",
  },
  multiple: {
    title: "Several records",
    description:
      '`selectionMode="multiple"` toggles records in the list and shows the chosen ones as tags that can be removed.',
    label: "Reviewers",
    remove: (name: string) => `Remove ${name}`,
  },
  slow: {
    title: "A slow load",
    description:
      "The pretend server takes three seconds: the sheet shows a spinner named by `loadingLabel` while it waits.",
    label: "Owner (slow server)",
    loading: "Loading owners",
  },
  failing: {
    title: "A load that fails",
    description:
      "The pretend server always fails: `loadErrorMessage` replaces the list, and typing again asks again.",
    label: "Contact (offline server)",
    failure: "The directory did not answer.",
  },
  create: {
    title: "Create a new record",
    description:
      "`onCreate` with `createLabel` adds a row for the typed text when it names no listed record; the record it returns is picked.",
    label: "Team member",
    createLabel: (text: string) => `Add “${text}”`,
  },
  states: {
    title: "States",
    description:
      "Each state of the field. Disabled and read-only keep their record and never open the sheet.",
    required: "Required",
    invalid: "Invalid",
    invalidError: "Choose a person before you continue.",
    disabled: "Disabled",
    readOnly: "Read-only",
  },
  live: {
    title: "Try it",
    description: "Choose a person; the readout names the record, and `null` once it is cleared.",
    label: "Approver",
    chosen: (option: EntityOption | null) => `Chosen: ${option?.label ?? "none"}`,
  },
} as const;

/** The records of the pretend server; Linus is shown but refused. */
const PEOPLE: readonly EntityOption[] = [
  {
    id: "ada",
    label: "Ada Lovelace",
    description: "ada@example.com",
    avatar: { name: "Ada Lovelace" },
  },
  {
    id: "grace",
    label: "Grace Hopper",
    description: "grace@example.com",
    avatar: { name: "Grace Hopper" },
  },
  {
    id: "alan",
    label: "Alan Turing",
    description: "alan@example.com",
    avatar: { name: "Alan Turing" },
  },
  {
    id: "katherine",
    label: "Katherine Johnson",
    description: "katherine@example.com",
    avatar: { name: "Katherine Johnson" },
  },
  {
    id: "margaret",
    label: "Margaret Hamilton",
    description: "margaret@example.com",
    avatar: { name: "Margaret Hamilton" },
  },
  {
    id: "linus",
    label: "Linus Torvalds",
    description: "On leave",
    avatar: { name: "Linus Torvalds" },
    isDisabled: true,
  },
  {
    id: "barbara",
    label: "Barbara Liskov",
    description: "barbara@example.com",
    avatar: { name: "Barbara Liskov" },
  },
  {
    id: "dennis",
    label: "Dennis Ritchie",
    description: "dennis@example.com",
    avatar: { name: "Dennis Ritchie" },
  },
  {
    id: "donald",
    label: "Donald Knuth",
    description: "donald@example.com",
    avatar: { name: "Donald Knuth" },
  },
  {
    id: "edsger",
    label: "Edsger Dijkstra",
    description: "edsger@example.com",
    avatar: { name: "Edsger Dijkstra" },
  },
  {
    id: "frances",
    label: "Frances Allen",
    description: "frances@example.com",
    avatar: { name: "Frances Allen" },
  },
  {
    id: "tim",
    label: "Tim Berners-Lee",
    description: "tim@example.com",
    avatar: { name: "Tim Berners-Lee" },
  },
];

/** The records the disabled and the read-only samples start with. */
const [ADA, GRACE] = PEOPLE;

/** How many records the pretend server returns per page. */
const PAGE_SIZE = 5;

/** How long the usual answer takes, and the slow one, in milliseconds. */
const DELAY = 400;
const SLOW_DELAY = 3000;

/** The loader the pretend server gives a picker: the records that match, a page at a time, after a delay, or a failure. */
function serverOf(delay: number, failure?: string) {
  return async (search: string, cursor?: string): Promise<EntityOptionPage> => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, delay);
    });
    if (failure !== undefined) throw new Error(failure);
    const needle = search.trim().toLocaleLowerCase();
    const matches = PEOPLE.filter((person) => person.label.toLocaleLowerCase().includes(needle));
    const start = cursor === undefined ? 0 : Number(cursor);
    const next = start + PAGE_SIZE;
    return {
      items: matches.slice(start, start + PAGE_SIZE),
      nextCursor: next < matches.length ? String(next) : null,
    };
  };
}

/** The pretend servers, made once so a picker is given the same loader on every render. */
const LOAD_PEOPLE = serverOf(DELAY);
const LOAD_SLOWLY = serverOf(SLOW_DELAY);
const LOAD_NOTHING = serverOf(DELAY, STRINGS.failing.failure);

/** The EntityPicker page: one section per option, in a scrollable screen. */
export function EntityPickerScreen() {
  const [assignee, setAssignee] = useState<EntityOption | null>(null);
  const [reviewers, setReviewers] = useState<readonly EntityOption[]>([]);
  const [owner, setOwner] = useState<EntityOption | null>(null);
  const [contact, setContact] = useState<EntityOption | null>(null);
  const [member, setMember] = useState<EntityOption | null>(null);
  const [approver, setApprover] = useState<EntityOption | null>(null);

  return (
    <Screen>
      <Section title={STRINGS.single.title} description={STRINGS.single.description}>
        <EntityPicker
          label={STRINGS.single.label}
          placeholder={STRINGS.single.placeholder}
          loadOptions={LOAD_PEOPLE}
          loadingLabel={STRINGS.single.loading}
          emptyMessage={STRINGS.single.empty}
          loadErrorMessage={STRINGS.single.failed}
          value={assignee}
          onChange={setAssignee}
        />
      </Section>

      <Section title={STRINGS.multiple.title} description={STRINGS.multiple.description}>
        <EntityPicker
          selectionMode="multiple"
          label={STRINGS.multiple.label}
          placeholder={STRINGS.single.placeholder}
          loadOptions={LOAD_PEOPLE}
          loadingLabel={STRINGS.single.loading}
          emptyMessage={STRINGS.single.empty}
          removeLabel={STRINGS.multiple.remove}
          value={reviewers}
          onChange={setReviewers}
        />
      </Section>

      <Section title={STRINGS.slow.title} description={STRINGS.slow.description}>
        <EntityPicker
          label={STRINGS.slow.label}
          placeholder={STRINGS.single.placeholder}
          loadOptions={LOAD_SLOWLY}
          loadingLabel={STRINGS.slow.loading}
          value={owner}
          onChange={setOwner}
        />
      </Section>

      <Section title={STRINGS.failing.title} description={STRINGS.failing.description}>
        <EntityPicker
          label={STRINGS.failing.label}
          placeholder={STRINGS.single.placeholder}
          loadOptions={LOAD_NOTHING}
          loadingLabel={STRINGS.single.loading}
          loadErrorMessage={STRINGS.single.failed}
          value={contact}
          onChange={setContact}
        />
      </Section>

      <Section title={STRINGS.create.title} description={STRINGS.create.description}>
        <EntityPicker
          label={STRINGS.create.label}
          placeholder={STRINGS.single.placeholder}
          loadOptions={LOAD_PEOPLE}
          loadingLabel={STRINGS.single.loading}
          createLabel={STRINGS.create.createLabel}
          onCreate={(text) => ({ id: text.toLocaleLowerCase(), label: text })}
          value={member}
          onChange={setMember}
        />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <EntityPicker
          label={STRINGS.states.required}
          loadOptions={LOAD_PEOPLE}
          isRequired
          defaultValue={null}
        />
        <EntityPicker
          label={STRINGS.states.invalid}
          loadOptions={LOAD_PEOPLE}
          isInvalid
          errorMessage={STRINGS.states.invalidError}
          defaultValue={null}
        />
        <EntityPicker
          label={STRINGS.states.disabled}
          loadOptions={LOAD_PEOPLE}
          isDisabled
          defaultValue={ADA ?? null}
        />
        <EntityPicker
          label={STRINGS.states.readOnly}
          loadOptions={LOAD_PEOPLE}
          isReadOnly
          defaultValue={GRACE ?? null}
        />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <EntityPicker
          label={STRINGS.live.label}
          placeholder={STRINGS.single.placeholder}
          loadOptions={LOAD_PEOPLE}
          loadingLabel={STRINGS.single.loading}
          emptyMessage={STRINGS.single.empty}
          value={approver}
          onChange={setApprover}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.chosen(approver)}
        </Text>
      </Section>
    </Screen>
  );
}
