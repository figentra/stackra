/**
 * Stackra file contract:
 * Purpose: the native `FloatingActionButton` compound on HeroUI Native Pro's FAB (a floating button that opens a
 *          menu of action items): the root maps `label` to `accessibilityLabel`; every other prop, `placement`,
 *          `align`, `isOpen`, `isDefaultOpen` and `onOpenChange` included, passes through.
 * Boundary: no behaviour or styling of its own; named in full because the grammar bans the abbreviation. The compound
 *          exposes the seven parts of HeroUI Native Pro, its own components. HeroUI Native Pro's `useFAB` and
 *          `useFABAnimation` hooks stay in `heroui-native-pro/fab`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import { FAB as HeroFab } from "heroui-native-pro/fab";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { FloatingActionButtonContractProps } from "#contracts/types/floating-action-button-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native FloatingActionButton: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type FloatingActionButtonProps = FloatingActionButtonContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroFab>,
    keyof FloatingActionButtonContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function FloatingActionButtonRoot({
  label,
  isDisabled,
  ...rest
}: FloatingActionButtonProps): ReactElement {
  return <HeroFab {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface FloatingActionButtonParts {
  /** The floating button itself: toggles the open state and measures itself for automatic placement. */
  readonly Trigger: typeof HeroFab.Trigger;
  /** The portal that carries the overlay and content above other content and keeps them mounted while closing. */
  readonly Portal: typeof HeroFab.Portal;
  /** The optional backdrop behind the content; pressing it closes the menu. */
  readonly Overlay: typeof HeroFab.Overlay;
  /** The positioned column of action items. */
  readonly Content: typeof HeroFab.Content;
  /** One action row; it closes the menu on press. */
  readonly Item: typeof HeroFab.Item;
  /** The theme-aware background container behind the content of an item. */
  readonly ItemBackground: typeof HeroFab.ItemBackground;
  /** The text label of an item. */
  readonly ItemLabel: typeof HeroFab.ItemLabel;
}

/**
 * A floating action button that opens a menu: `FloatingActionButton.Trigger` is the button and, in
 * `FloatingActionButton.Portal`, the `FloatingActionButton.Overlay` and `FloatingActionButton.Content` hold the
 * `FloatingActionButton.Item` rows. Name it for screen readers with `label`.
 */
export const FloatingActionButton: typeof FloatingActionButtonRoot & FloatingActionButtonParts =
  Object.assign(FloatingActionButtonRoot, {
    Trigger: HeroFab.Trigger,
    Portal: HeroFab.Portal,
    Overlay: HeroFab.Overlay,
    Content: HeroFab.Content,
    Item: HeroFab.Item,
    ItemBackground: HeroFab.ItemBackground,
    ItemLabel: HeroFab.ItemLabel,
  });
