/**
 * Stackra file contract:
 * Purpose: `MentionInputContractProps`, the props every runtime's `MentionInput` takes: a text box where typing `@`
 *          opens a list of people to mention, and choosing one writes `@Name` into the text.
 * Boundary: types only; the value is plain text with `@Name` in it, and the mentioned ids are reported beside it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); STA-1371 (wave C, owner request
 *          2026-10-29).
 */
import type { CommentPerson } from "#contracts/types/comment-person.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `MentionInput`. */
export interface MentionInputContractProps extends FieldContractProps<string> {
  /** The people who can be mentioned; the list shows those whose name starts with what follows the `@`. */
  readonly people: readonly CommentPerson[];
  /** Called with the ids of the people the text mentions, in the order they first appear, each time the text changes. */
  readonly onMentionsChange?: ((ids: readonly string[]) => void) | undefined;
  /** Hint text inside the empty box. */
  readonly placeholder?: string | undefined;
  /** The number of lines the box shows. Defaults to 3. */
  readonly rows?: number | undefined;
  /** How many people the list shows at most. Defaults to 6. */
  readonly maxSuggestions?: number | undefined;
}
