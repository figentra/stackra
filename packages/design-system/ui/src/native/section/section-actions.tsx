/**
 * Stackra file contract:
 * Purpose: the actions of the native `Section`: the first three as small buttons (the first primary, the next two
 *          secondary), the rest in an ActionMenu named by `moreActionsLabel`, then the section's end slot. A button runs
 *          the action's `onPress` and then follows its `href`: an app path through the nearest `RouterProvider`, an
 *          absolute URL in the system browser.
 * Boundary: reached from `Section` only; the barrel does not export it. It builds on the earlier waves' Button, Text and
 *           ActionMenu and the core split, never on PageHeader, a sibling of its wave (ADR 0314 decision 4). A string or
 *           number in `endContent` is drawn inside `Text`, since React Native refuses a bare string in a `View`. A
 *           disabled action is a disabled button, which its reason does not reach: the reason is the overflow menu's
 *           second line only.
 * Runtime: react-native
 * Governing contract: ADR 0314 (decisions 1 and 4); ADR 0302 (decision 3, adapted forms); WCAG 2.2 SC 2.5.8.
 */
import { use, type ReactElement, type ReactNode } from "react";
import { Linking, View } from "react-native";

import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { pageActionVariant } from "#core/functions/page-action-variant.function";
import { splitPageActions } from "#core/functions/split-page-actions.function";
import { ActionMenu } from "#native/action-menu/action-menu";
import { Button } from "#native/button/button";
import { RouterContext } from "#native/router-provider/router-context";
import { Text } from "#native/text/text";

/** An absolute URL: it starts with a scheme (`https:`, `mailto:`, `tel:`, the app's own). */
const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;

// shortcut: English until @stackra/i18n ships; then the key `ui::section.could-not-open`.
const STRINGS = { couldNotOpen: "Link could not open its URL" } as const;

/** Props of {@link SectionActions}. */
interface SectionActionsProps {
  /** The section's actions in priority order. */
  readonly actions: readonly MenuLeafItem[];
  /** The accessible name of the overflow menu's button. */
  readonly moreActionsLabel: string;
  /** A node drawn after the actions. */
  readonly endContent?: ReactNode;
}

/** One shown action: a button that runs `onPress` and then follows `href`. */
function ActionButton({
  action,
  isPrimary,
}: {
  readonly action: MenuLeafItem;
  readonly isPrimary: boolean;
}): ReactElement {
  const navigate = use(RouterContext);
  const follow = () => {
    action.onPress?.();
    const { href } = action;
    if (!href) return;
    if (navigate && !HAS_SCHEME.test(href)) {
      navigate(href);
      return;
    }
    // The URL stays out of the warning: it may hold a token.
    Linking.openURL(href).catch(() => console.warn(STRINGS.couldNotOpen));
  };
  return (
    <Button
      variant={pageActionVariant(action, isPrimary)}
      size="sm"
      onPress={follow}
      {...omitUndefined({ isDisabled: action.isDisabled, startIcon: action.icon })}
    >
      {action.label}
    </Button>
  );
}

/** The buttons, the overflow menu and the end slot of a section, or nothing when there are none. */
export function SectionActions({
  actions,
  moreActionsLabel,
  endContent,
}: SectionActionsProps): ReactElement | null {
  const { visible, overflow } = splitPageActions(actions);
  if (visible.length === 0 && endContent == null) return null;
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      {visible.map((action, index) => (
        <ActionButton key={action.id} action={action} isPrimary={index === 0} />
      ))}
      {overflow.length === 0 ? null : (
        <ActionMenu
          label={moreActionsLabel}
          variant="secondary"
          size="sm"
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
