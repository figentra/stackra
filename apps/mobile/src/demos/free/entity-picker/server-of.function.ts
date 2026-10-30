/**
 * Stackra file contract:
 * Purpose: `serverOf`, the loader a pretend server gives a native EntityPicker demo: the people that match, a page at a
 *          time, after a delay, or a failure.
 * Boundary: pure apart from the timer; the words it needs (the refused person's reason, the failure) are passed in.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract).
 */
import type { EntityOptionPage } from "@stackra/ui/contracts";

import { PEOPLE } from "#src/demos/free/entity-picker/people.constant";

/** How many records the pretend server returns per page. */
const PAGE_SIZE = 5;

/** A loader that answers after `delay` ms; `failure` makes every answer fail with that message. */
export function serverOf(
  delay: number,
  words: { readonly refused: string; readonly failure?: string },
): (search: string, cursor?: string) => Promise<EntityOptionPage> {
  const people = PEOPLE.map((item) =>
    item.isDisabled ? { ...item, description: words.refused } : item,
  );
  return async (search, cursor) => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, delay);
    });
    if (words.failure !== undefined) throw new Error(words.failure);
    const needle = search.trim().toLocaleLowerCase();
    const matches = people.filter((item) => item.label.toLocaleLowerCase().includes(needle));
    const start = cursor === undefined ? 0 : Number(cursor);
    const next = start + PAGE_SIZE;
    return {
      items: matches.slice(start, next),
      nextCursor: next < matches.length ? String(next) : null,
    };
  };
}
