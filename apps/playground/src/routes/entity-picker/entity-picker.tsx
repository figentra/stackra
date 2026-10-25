/**
 * Stackra file contract:
 * Purpose: the page of the entity picker route: one record and several (the chosen ones as removable tags), records
 *          with avatars, initials and icons, a slow server with its spinner, a failing server with its message, the
 *          create-new row, every state (required, invalid, disabled, read-only) and a live example that reports the
 *          chosen records, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The servers are timers over a
 *           list, so the loading, paging and failed states can be seen and tested.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0318; ADR 0055; ADR 0060 (light, dark, RTL).
 */
import type { EntityOption, EntityOptionPage } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { EntityPickerRoute } from "#src/routes/entity-picker/entity-picker.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::entity-picker.*` keys.
const STRINGS = {
  documentTitle: `${EntityPickerRoute.title} · Stackra Playground`,
  intro:
    "An entity picker finds records the server holds: one, or several shown as removable tags. It searches as you pause typing, pages through long answers and keeps a chosen record's name when a later search no longer lists it. For a short fixed list use a select or a combo box.",
  basics: "Basics",
  basicsNote:
    "A person picker with photos or initials and a second line, a team picker whose records carry an icon, and a picker with a description.",
  ownerLabel: "Owner",
  ownerPlaceholder: "Search people",
  teamLabel: "Team",
  teamPlaceholder: "Search teams",
  reviewerLabel: "Reviewer",
  reviewerDescription: "The person who signs the change off.",
  several: "Several records",
  severalNote:
    "In multiple mode the field stays for typing and each chosen record shows as a tag whose remove button says whom it removes.",
  reviewersLabel: "Reviewers",
  remove: (name: string) => `Remove ${name}`,
  server: "A slow or failing server",
  serverNote:
    "The first picker's server takes two seconds, so its named spinner shows. The second one's always fails, and the picker says so beside the list.",
  slowLabel: "Owner (slow server)",
  loading: "Loading people",
  failingLabel: "Owner (offline server)",
  failed: "People could not be loaded. Type to try again.",
  create: "Create a record",
  createNote:
    "When nothing listed has the typed name, the last row offers to add it; the new record is chosen once the app has made it.",
  createLabel: "Assignee",
  createRow: (text: string) => `Add “${text}”`,
  states: "States",
  statesNote: "Each state of the field. Disabled and read-only keep their value.",
  required: "Required",
  invalid: "Invalid",
  invalidError: "Choose an owner before you continue.",
  disabled: "Disabled",
  readOnly: "Read-only",
  empty: "No people found.",
  live: "Try it",
  liveNote: "Pick one owner and any number of followers; the page reports what the pickers hold.",
  liveOwner: "Owner",
  liveFollowers: "Followers",
  chosenOwner: (owner: EntityOption | null) => `Owner: ${owner ? owner.label : "none"}`,
  chosenFollowers: (followers: readonly EntityOption[]) =>
    `Followers: ${followers.length === 0 ? "none" : followers.map((person) => person.label).join(", ")}`,
} as const;

/** The people of the samples, and of the pretend server. */
const PEOPLE: readonly EntityOption[] = [
  ["ada", "Ada Lovelace", "ada@example.com"],
  ["alan", "Alan Turing", "alan@example.com"],
  ["grace", "Grace Hopper", "grace@example.com"],
  ["katherine", "Katherine Johnson", "katherine@example.com"],
  ["edsger", "Edsger Dijkstra", "edsger@example.com"],
  ["barbara", "Barbara Liskov", "barbara@example.com"],
  ["donald", "Donald Knuth", "donald@example.com"],
  ["margaret", "Margaret Hamilton", "margaret@example.com"],
  ["tim", "Tim Berners-Lee", "tim@example.com"],
  ["radia", "Radia Perlman", "radia@example.com"],
  ["john", "John McCarthy", "john@example.com"],
  ["frances", "Frances Allen", "frances@example.com"],
  ["ken", "Ken Thompson", "ken@example.com"],
  ["dennis", "Dennis Ritchie", "dennis@example.com"],
  ["hedy", "Hedy Lamarr", "hedy@example.com"],
  ["claude", "Claude Shannon", "claude@example.com"],
  ["sophie", "Sophie Wilson", "sophie@example.com"],
  ["linus", "Linus Torvalds", "linus@example.com", true],
].map(([id, label, description, isDisabled]) => ({
  id: id as string,
  label: label as string,
  description: description as string,
  avatar: { name: label as string },
  ...(isDisabled ? { isDisabled: true } : {}),
}));

/** The teams of the sample whose records are things, drawn with an icon. */
const TEAMS: readonly EntityOption[] = [
  { id: "design", label: "Design", avatar: { icon: "palette" } },
  { id: "platform", label: "Platform", avatar: { icon: "server" } },
  { id: "support", label: "Support", avatar: { icon: "life-buoy" } },
];

/** How many records a pretend server answers per page, and how long it takes, in milliseconds. */
const PAGE_SIZE = 8;
const SERVER_DELAY = 300;
const SLOW_DELAY = 2000;

/** A pretend server over `records`: it answers after `delay`, a page at a time, the cursor being the next index. */
const serverOver =
  (records: readonly EntityOption[], delay = SERVER_DELAY) =>
  (search: string, cursor?: string) =>
    new Promise<EntityOptionPage>((resolve) => {
      const matches = records.filter((record) =>
        record.label.toLowerCase().includes(search.trim().toLowerCase()),
      );
      const start = cursor === undefined ? 0 : Number(cursor);
      const next = start + PAGE_SIZE;
      setTimeout(
        () =>
          resolve({
            items: matches.slice(start, next),
            nextCursor: next < matches.length ? String(next) : null,
          }),
        delay,
      );
    });

const searchPeople = serverOver(PEOPLE);
const searchTeams = serverOver(TEAMS);
const searchSlowly = serverOver(PEOPLE, SLOW_DELAY);

/** A server that is always down, so the failed state can be seen. */
const searchOffline = () =>
  new Promise<EntityOptionPage>((_, reject) =>
    setTimeout(() => reject(new Error("offline")), SERVER_DELAY),
  );

/** The grid that lays the samples out in a wrapping row of fixed-width fields. */
const ROW = "flex flex-wrap items-start gap-6";

/** The width of a sample field, so its label and error wrap the same way in every sample. */
const SAMPLE = "w-72";

/** The EntityPicker page. */
export function EntityPicker() {
  const [created, setCreated] = useState<readonly EntityOption[]>([]);
  const [owner, setOwner] = useState<EntityOption | null>(null);
  const [followers, setFollowers] = useState<readonly EntityOption[]>([]);
  const searchWithCreated = serverOver([...PEOPLE, ...created]);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{EntityPickerRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="entity-picker-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <div className={ROW}>
          <Ui.EntityPicker
            loadOptions={searchPeople}
            label={STRINGS.ownerLabel}
            placeholder={STRINGS.ownerPlaceholder}
            loadingLabel={STRINGS.loading}
            emptyMessage={STRINGS.empty}
            className={SAMPLE}
          />
          <Ui.EntityPicker
            loadOptions={searchTeams}
            label={STRINGS.teamLabel}
            placeholder={STRINGS.teamPlaceholder}
            className={SAMPLE}
          />
          <Ui.EntityPicker
            loadOptions={searchPeople}
            label={STRINGS.reviewerLabel}
            description={STRINGS.reviewerDescription}
            placeholder={STRINGS.ownerPlaceholder}
            defaultValue={PEOPLE[2] ?? null}
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="entity-picker-several" title={STRINGS.several} note={STRINGS.severalNote}>
        <div className={ROW}>
          <Ui.EntityPicker
            loadOptions={searchPeople}
            label={STRINGS.reviewersLabel}
            placeholder={STRINGS.ownerPlaceholder}
            selectionMode="multiple"
            removeLabel={STRINGS.remove}
            defaultValue={PEOPLE.slice(0, 2)}
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="entity-picker-server" title={STRINGS.server} note={STRINGS.serverNote}>
        <div className={ROW}>
          <Ui.EntityPicker
            loadOptions={searchSlowly}
            label={STRINGS.slowLabel}
            placeholder={STRINGS.ownerPlaceholder}
            loadingLabel={STRINGS.loading}
            className={SAMPLE}
          />
          <Ui.EntityPicker
            loadOptions={searchOffline}
            label={STRINGS.failingLabel}
            placeholder={STRINGS.ownerPlaceholder}
            loadingLabel={STRINGS.loading}
            loadErrorMessage={STRINGS.failed}
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="entity-picker-create" title={STRINGS.create} note={STRINGS.createNote}>
        <div className={ROW}>
          <Ui.EntityPicker
            loadOptions={searchWithCreated}
            label={STRINGS.createLabel}
            placeholder={STRINGS.ownerPlaceholder}
            createLabel={STRINGS.createRow}
            onCreate={(text) => {
              const person = {
                id: `new-${created.length + 1}`,
                label: text,
                avatar: { name: text },
              };
              setCreated((current) => [...current, person]);
              return person;
            }}
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="entity-picker-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={ROW}>
          <Ui.EntityPicker
            loadOptions={searchPeople}
            label={STRINGS.required}
            placeholder={STRINGS.ownerPlaceholder}
            isRequired
            className={SAMPLE}
          />
          <Ui.EntityPicker
            loadOptions={searchPeople}
            label={STRINGS.invalid}
            placeholder={STRINGS.ownerPlaceholder}
            isInvalid
            errorMessage={STRINGS.invalidError}
            className={SAMPLE}
          />
          <Ui.EntityPicker
            loadOptions={searchPeople}
            label={STRINGS.disabled}
            defaultValue={PEOPLE[0] ?? null}
            isDisabled
            className={SAMPLE}
          />
          <Ui.EntityPicker
            loadOptions={searchPeople}
            label={STRINGS.readOnly}
            selectionMode="multiple"
            removeLabel={STRINGS.remove}
            defaultValue={PEOPLE.slice(0, 2)}
            isReadOnly
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="entity-picker-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className={ROW}>
          <Ui.EntityPicker
            loadOptions={searchPeople}
            label={STRINGS.liveOwner}
            placeholder={STRINGS.ownerPlaceholder}
            loadingLabel={STRINGS.loading}
            emptyMessage={STRINGS.empty}
            value={owner}
            onChange={setOwner}
            className={SAMPLE}
          />
          <Ui.EntityPicker
            loadOptions={searchPeople}
            label={STRINGS.liveFollowers}
            placeholder={STRINGS.ownerPlaceholder}
            loadingLabel={STRINGS.loading}
            emptyMessage={STRINGS.empty}
            selectionMode="multiple"
            removeLabel={STRINGS.remove}
            value={followers}
            onChange={setFollowers}
            className={SAMPLE}
          />
        </div>
        <Ui.Text role="status" data-testid="entity-picker-owner" tone="muted">
          {STRINGS.chosenOwner(owner)}
        </Ui.Text>
        <Ui.Text role="status" data-testid="entity-picker-followers" tone="muted">
          <bdi>{STRINGS.chosenFollowers(followers)}</bdi>
        </Ui.Text>
      </PageSection>
    </article>
  );
}
