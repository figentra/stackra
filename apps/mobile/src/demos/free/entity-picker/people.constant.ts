/**
 * Stackra file contract:
 * Purpose: `PEOPLE`, the records of the native EntityPicker demos' pretend server; Linus is shown but refused.
 * Boundary: sample data only; names and emails are never translated (the refused one's reason is added by `serverOf`).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract).
 */
import type { EntityOption } from "@stackra/ui/contracts";

/** A person of the directory, by name; the email is derived from the first name. */
const person = (name: string, isDisabled = false): EntityOption => ({
  id: name.split(" ")[0]?.toLocaleLowerCase() ?? name,
  label: name,
  description: `${name.split(" ")[0]?.toLocaleLowerCase() ?? name}@example.com`,
  avatar: { name },
  ...(isDisabled ? { isDisabled } : {}),
});

/** Twelve people. */
export const PEOPLE: readonly EntityOption[] = [
  person("Ada Lovelace"),
  person("Grace Hopper"),
  person("Alan Turing"),
  person("Katherine Johnson"),
  person("Margaret Hamilton"),
  person("Linus Torvalds", true),
  person("Barbara Liskov"),
  person("Dennis Ritchie"),
  person("Donald Knuth"),
  person("Edsger Dijkstra"),
  person("Frances Allen"),
  person("Tim Berners-Lee"),
];
