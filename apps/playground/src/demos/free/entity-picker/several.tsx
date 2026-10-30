/**
 * Stackra file contract:
 * Purpose: the "several" demo of the web Entity picker: In multiple mode the field stays for typing and each chosen
 *          record shows as a tag whose remove button says whom it removes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0318; ADR 0055; ADR 0060 (light, dark, RTL).
 */
import type { EntityOption, EntityOptionPage } from "@stackra/ui/contracts";
import { EntityPicker as UiEntityPicker, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ENTITY_PICKER_KEYS } from "#src/demos/free/entity-picker/entity-picker-keys.constant";

/** The demo's keys. */
const K = ENTITY_PICKER_KEYS.entity_picker;

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

/** How many records a pretend server answers per page, and how long it takes, in milliseconds. */
const PAGE_SIZE = 8;

const SERVER_DELAY = 300;

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

/** The grid that lays the samples out in a wrapping row of fixed-width fields. */
const ROW = "flex flex-wrap items-start gap-6";

/** The width of a sample field, so its label and error wrap the same way in every sample. */
const SAMPLE = "w-72";

/** Entity picker: Several records. */
export default function Several() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      <UiEntityPicker
        loadOptions={searchPeople}
        label={t(K.reviewers_label)}
        placeholder={t(K.owner_placeholder)}
        selectionMode="multiple"
        removeLabel={(name) => t(K.remove, { name })}
        defaultValue={PEOPLE.slice(0, 2)}
        className={SAMPLE}
      />
    </div>
  );
}
