/**
 * Stackra file contract:
 * Purpose: `useTagInputState(props)`, the state every runtime's TagInput shares: the tags (controlled or not), the
 *          draft text, adding typed or pasted text through `splitTags` and `addTags`, removing, and the message for the
 *          last refused tag in the `ui` catalogue's words.
 * Boundary: a React hook with no rendering; the runtimes draw the field; the web and native TagInput both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A, owner request 2026-10-29).
 */
import { useState } from "react";

import type { TagInputContractProps } from "#contracts/types/tag-input-contract-props.type";
import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { addTags } from "#core/functions/add-tags.function";
import { splitTags } from "#core/functions/split-tags.function";
import { useUiText } from "#react/hooks/use-ui-text";

/** The tag input's keys. */
const K = DISPLAY_KEYS.ui.tag_input;

/** The shared tag input state. */
export function useTagInputState({
  value,
  defaultValue,
  onChange,
  maxTags,
  validate,
  allowDuplicates,
}: TagInputContractProps): {
  readonly tags: readonly string[];
  readonly draft: string;
  readonly setDraft: (draft: string) => void;
  readonly problem: string | null;
  readonly add: (text: string) => void;
  readonly remove: (index: number) => void;
  readonly isFull: boolean;
} {
  const t = useUiText();
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const tags = value ?? own;
  const set = (next: readonly string[]) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const add = (text: string) => {
    const result = addTags(tags, splitTags(text), { max: maxTags, validate, allowDuplicates });
    if (result.tags.length !== tags.length) set(result.tags);
    const first = result.rejected[0];
    setProblem(
      !first
        ? null
        : first.reason === "invalid"
          ? (first.message ?? null)
          : first.reason === "duplicate"
            ? t(K.duplicate, { tag: first.tag })
            : t(K.max, { max: maxTags ?? 0 }),
    );
    setDraft("");
  };
  const remove = (index: number) => {
    set(tags.filter((_, at) => at !== index));
    setProblem(null);
  };
  return {
    tags,
    draft,
    setDraft,
    problem,
    add,
    remove,
    isFull: maxTags !== undefined && tags.length >= maxTags,
  };
}
