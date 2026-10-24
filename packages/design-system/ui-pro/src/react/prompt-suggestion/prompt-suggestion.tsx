/**
 * Stackra file contract:
 * Purpose: the web `PromptSuggestion` compound on HeroUI Pro's PromptSuggestion: suggested prompts near a composer,
 *          with the parts Header, Title, Description, Group, Items, Item, ItemTitle, ItemDescription, ItemFooter,
 *          ItemTags and ItemMeta, HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro's `variant` picks
 *          a layout (`pill` or `card`), not a colour role, so it keeps its name. The compound exposes the documented
 *          parts: HeroUI Pro's `PromptSuggestion.Root` is left out. Imports the `prompt-suggestion` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  PromptSuggestion as HeroPromptSuggestion,
  type PromptSuggestionRootProps as HeroPromptSuggestionRootProps,
} from "@heroui-pro/react/prompt-suggestion";

import type { PromptSuggestionContractProps } from "#contracts/types/prompt-suggestion-contract-props.type";

/** Props of the web PromptSuggestion: the shared contract plus HeroUI Pro's own root props, passed through. */
export type PromptSuggestionProps = PromptSuggestionContractProps &
  Omit<HeroPromptSuggestionRootProps, keyof PromptSuggestionContractProps>;

/** The root: HeroUI Pro's, which lays the suggestions out as pills or cards by `variant`. */
function PromptSuggestionRoot(props: PromptSuggestionProps) {
  return <HeroPromptSuggestion.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface PromptSuggestionParts {
  /** The heading block above the suggestions. */
  readonly Header: typeof HeroPromptSuggestion.Header;
  /** The heading. */
  readonly Title: typeof HeroPromptSuggestion.Title;
  /** The sentence under the heading. */
  readonly Description: typeof HeroPromptSuggestion.Description;
  /** A labelled set of suggestions. */
  readonly Group: typeof HeroPromptSuggestion.Group;
  /** The wrapper of the suggestions. */
  readonly Items: typeof HeroPromptSuggestion.Items;
  /** One suggestion, a pressable button. */
  readonly Item: typeof HeroPromptSuggestion.Item;
  /** The title of a card suggestion. */
  readonly ItemTitle: typeof HeroPromptSuggestion.ItemTitle;
  /** The description of a card suggestion. */
  readonly ItemDescription: typeof HeroPromptSuggestion.ItemDescription;
  /** The footer of a card suggestion. */
  readonly ItemFooter: typeof HeroPromptSuggestion.ItemFooter;
  /** The tags of a card suggestion. */
  readonly ItemTags: typeof HeroPromptSuggestion.ItemTags;
  /** A small note on a card suggestion. */
  readonly ItemMeta: typeof HeroPromptSuggestion.ItemMeta;
}

/** Suggested prompts: `PromptSuggestion.Header`, then `Items` of `Item`, or `Group`s of them. */
export const PromptSuggestion: typeof PromptSuggestionRoot & PromptSuggestionParts = Object.assign(
  PromptSuggestionRoot,
  {
    Header: HeroPromptSuggestion.Header,
    Title: HeroPromptSuggestion.Title,
    Description: HeroPromptSuggestion.Description,
    Group: HeroPromptSuggestion.Group,
    Items: HeroPromptSuggestion.Items,
    Item: HeroPromptSuggestion.Item,
    ItemTitle: HeroPromptSuggestion.ItemTitle,
    ItemDescription: HeroPromptSuggestion.ItemDescription,
    ItemFooter: HeroPromptSuggestion.ItemFooter,
    ItemTags: HeroPromptSuggestion.ItemTags,
    ItemMeta: HeroPromptSuggestion.ItemMeta,
  },
);
