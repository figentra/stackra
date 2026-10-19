import { {{PASCAL}}Error } from "./{{NAME}}-error";

/**
 * The package's aggregate as the domain understands it, independent of storage. Rename it to what this
 * package is actually about — a template cannot know your domain.
 */
export interface {{PASCAL}}Record {
  readonly id: string;
  readonly label: string;
}

/**
 * Build a record, enforcing the domain's invariants.
 *
 * @throws {{{PASCAL}}Error} when `id` is empty or `label` is blank.
 */
export function create{{PASCAL}}Record(input: { id: string; label: string }): {{PASCAL}}Record {
  const label = input.label.trim();
  if (input.id.length === 0) {
    throw new {{PASCAL}}Error("A {{NAME}} record needs an id.");
  }
  if (label.length === 0) {
    throw new {{PASCAL}}Error("A {{NAME}} record needs a non-empty label.");
  }
  return Object.freeze({ id: input.id, label });
}
