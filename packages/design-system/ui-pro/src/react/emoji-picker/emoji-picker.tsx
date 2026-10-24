/**
 * Stackra file contract:
 * Purpose: the web `EmojiPicker` compound on HeroUI Pro's EmojiPicker: the root takes the shared `size` and names the
 *          picker from `label`, `SkinToneTrigger` and `SkinToneContent` name themselves from `label`, and every
 *          other part (Trigger, Value, Popover, Content, Grid, Item, Footer, SkinTonePicker, SkinToneOption) is
 *          HeroUI Pro's own. HeroUI Pro's `EMOJI_CATEGORIES` and `EMOJI_SKIN_TONES` data come with it.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `EmojiPicker.Root` is left out. Imports the `emoji-picker` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import {
  EmojiPicker as HeroEmojiPicker,
  type EmojiPickerProps as HeroEmojiPickerProps,
  type EmojiPickerSkinToneContentProps as HeroEmojiPickerSkinToneContentProps,
  type EmojiPickerSkinToneTriggerProps as HeroEmojiPickerSkinToneTriggerProps,
} from "@heroui-pro/react/emoji-picker";

import type {
  EmojiPickerContractProps,
  EmojiPickerSkinToneContentContractProps,
  EmojiPickerSkinToneTriggerContractProps,
} from "#contracts/types/emoji-picker-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web EmojiPicker: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type EmojiPickerProps = EmojiPickerContractProps &
  Omit<HeroEmojiPickerProps, keyof EmojiPickerContractProps | "aria-label">;

/** The picker: HeroUI Pro's `EmojiPicker.Root`, a select named by `label`. */
function EmojiPickerRoot({ size, label, ...rest }: EmojiPickerProps) {
  return <HeroEmojiPicker.Root {...rest} {...omitUndefined({ size, "aria-label": label })} />;
}

/** Props of `EmojiPicker.SkinToneTrigger`: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type EmojiPickerSkinToneTriggerProps = EmojiPickerSkinToneTriggerContractProps &
  Omit<
    HeroEmojiPickerSkinToneTriggerProps,
    keyof EmojiPickerSkinToneTriggerContractProps | "aria-label"
  >;

/** The skin-tone button: HeroUI Pro's, named by `label`. */
function EmojiPickerSkinToneTrigger({ label, ...rest }: EmojiPickerSkinToneTriggerProps) {
  return <HeroEmojiPicker.SkinToneTrigger {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** Props of `EmojiPicker.SkinToneContent`: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type EmojiPickerSkinToneContentProps = EmojiPickerSkinToneContentContractProps &
  Omit<
    HeroEmojiPickerSkinToneContentProps,
    keyof EmojiPickerSkinToneContentContractProps | "aria-label"
  >;

/** The skin-tone list: HeroUI Pro's, named by `label`. */
function EmojiPickerSkinToneContent({ label, ...rest }: EmojiPickerSkinToneContentProps) {
  return <HeroEmojiPicker.SkinToneContent {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface EmojiPickerParts {
  /** The button that opens the popover. */
  readonly Trigger: typeof HeroEmojiPicker.Trigger;
  /** The chosen emoji, drawn inside the trigger. */
  readonly Value: typeof HeroEmojiPicker.Value;
  /** The popover that holds the picker. */
  readonly Popover: typeof HeroEmojiPicker.Popover;
  /** The picker body: a search field and the grid. */
  readonly Content: typeof HeroEmojiPicker.Content;
  /** The virtualised grid of emoji. */
  readonly Grid: typeof HeroEmojiPicker.Grid;
  /** One emoji of the grid. */
  readonly Item: typeof HeroEmojiPicker.Item;
  /** The bottom row of the picker. */
  readonly Footer: typeof HeroEmojiPicker.Footer;
  /** Holds the chosen skin tone. */
  readonly SkinTonePicker: typeof HeroEmojiPicker.SkinTonePicker;
  /** The button that opens the skin-tone list, named by `label`. */
  readonly SkinToneTrigger: typeof EmojiPickerSkinToneTrigger;
  /** The skin-tone list, named by `label`. */
  readonly SkinToneContent: typeof EmojiPickerSkinToneContent;
  /** One skin tone, identified by its `id`. */
  readonly SkinToneOption: typeof HeroEmojiPicker.SkinToneOption;
}

/**
 * An emoji picker in a popover: `EmojiPicker.Trigger` shows the chosen `Value`, and `EmojiPicker.Popover` holds
 * `Content` with the `Grid` of `Item` emoji. Name the picker for screen readers with `label`.
 */
export const EmojiPicker: typeof EmojiPickerRoot & EmojiPickerParts = Object.assign(
  EmojiPickerRoot,
  {
    Trigger: HeroEmojiPicker.Trigger,
    Value: HeroEmojiPicker.Value,
    Popover: HeroEmojiPicker.Popover,
    Content: HeroEmojiPicker.Content,
    Grid: HeroEmojiPicker.Grid,
    Item: HeroEmojiPicker.Item,
    Footer: HeroEmojiPicker.Footer,
    SkinTonePicker: HeroEmojiPicker.SkinTonePicker,
    SkinToneTrigger: EmojiPickerSkinToneTrigger,
    SkinToneContent: EmojiPickerSkinToneContent,
    SkinToneOption: HeroEmojiPicker.SkinToneOption,
  },
);

export { EMOJI_CATEGORIES, EMOJI_SKIN_TONES } from "@heroui-pro/react/emoji-picker";
