/**
 * Stackra file contract:
 * Purpose: the actions row that PageHeader and Section share on native: the first three actions as buttons (the first
 *          primary, the next two secondary), the rest in an ActionMenu named by `moreActionsLabel`, then the end slot.
 *          A button runs the action's `onPress` and then follows its `href`: an app path through the nearest
 *          `RouterProvider`, an absolute URL in the system browser. `size` is `md` for a screen and `sm` for a card
 *          header.
 * Boundary: an internal piece, reached from PageHeader and Section only; the barrel does not export it, and it takes
 *           its parts as props, so neither of them imports the other (ADR 0317 decision 4). It builds on the earlier
 *           waves' Button, Text and ActionMenu and the core split. A string or number in `endContent` is drawn inside
 *           `Text`, since React Native refuses a bare string in a `View`. A disabled action is a disabled button,
 *           which its reason does not reach: the reason is the overflow menu's second line only.
 * Runtime: react-native
 * Governing contract: ADR 0317 (decisions 1 and 4); ADR 0302 (decision 3, adapted forms); WCAG 2.2 SC 2.5.8.
 */
import { use, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";

import type { Size } from "#contracts/enums/size.enum";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { pageActionVariant } from "#core/functions/page-action-variant.function";
import { splitPageActions } from "#core/functions/split-page-actions.function";
import { ActionMenu } from "#native/action-menu/action-menu";
import { Button } from "#native/button/button";
import { followHref } from "#native/router-provider/follow-href.function";
import { RouterContext } from "#native/router-provider/router-context";
import { Text } from "#native/text/text";

// Developer log text, read in the console only, so it stays English (ADR 0080 translates what users see).
const COULD_NOT_OPEN = "Link could not open its URL";

/** Props of {@link PageActions}. */
interface PageActionsProps {
  /** The actions in priority order. */
  readonly actions: readonly MenuLeafItem[];
  /** The accessible name of the overflow menu's button. */
  readonly moreActionsLabel: string;
  /** A node drawn after the actions. */
  readonly endContent?: ReactNode;
  /** The size of every button and of the overflow button. Defaults to `md`. */
  readonly size?: Size;
}

/** One shown action: a button that runs `onPress` and then follows `href`. */
function ActionButton({
  action,
  isPrimary,
  size,
}: {
  readonly action: MenuLeafItem;
  readonly isPrimary: boolean;
  readonly size: Size;
}): ReactElement {
  const navigate = use(RouterContext);
  const follow = () => {
    action.onPress?.();
    if (action.href) followHref(action.href, navigate, COULD_NOT_OPEN);
  };
  return (
    <Button
      variant={pageActionVariant(action, isPrimary)}
      size={size}
      onPress={follow}
      {...omitUndefined({ isDisabled: action.isDisabled, startIcon: action.icon })}
    >
      {action.label}
    </Button>
  );
}

/** The buttons, the overflow menu and the end slot of a screen or section, or nothing when there are none. */
export function PageActions({
  actions,
  moreActionsLabel,
  endContent,
  size = "md",
}: PageActionsProps): ReactElement | null {
  const { visible, overflow } = splitPageActions(actions);
  if (visible.length === 0 && endContent == null) return null;
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      {visible.map((action, index) => (
        <ActionButton key={action.id} action={action} isPrimary={index === 0} size={size} />
      ))}
      {overflow.length === 0 ? null : (
        <ActionMenu
          label={moreActionsLabel}
          variant="secondary"
          size={size}
          sections={[
            { id: "more-actions", title: moreActionsLabel, isTitleHidden: true, items: overflow },
          ]}
        />
      )}
      {typeof endContent === "string" || typeof endContent === "number" ? (
        <Text>{endContent}</Text>
      ) : (
        endContent
      )}
    </View>
  );
}
