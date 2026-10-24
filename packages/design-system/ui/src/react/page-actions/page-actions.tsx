/**
 * Stackra file contract:
 * Purpose: the actions row that PageHeader and Section share on web: the first three actions as buttons (the first
 *          primary, the next two secondary), the rest in an ActionMenu named by `moreActionsLabel`, then the end slot.
 *          An action with an `href` is a link drawn as a button, so it navigates through the nearest `RouterProvider`;
 *          one with only `onPress` is a button. `size` is `md` for a page and `sm` for a card header.
 * Boundary: an internal piece, reached from PageHeader and Section only; the barrel does not export it, and it takes
 *           its parts as props, so neither of them imports the other (ADR 0317 decision 4). It builds on the earlier
 *           waves' Button and ActionMenu and the core split. A disabled action is always a button, so it leaves the tab
 *           order like every disabled button. The link-as-button is React Aria's `Link` with HeroUI's `buttonVariants`,
 *           the composition HeroUI documents for a router link.
 * Runtime: browser
 * Governing contract: ADR 0317 (decisions 1 and 4); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 2.5.8.
 */
import { buttonVariants } from "@heroui/react";
import type { ReactElement, ReactNode } from "react";
import { Link as RouterLink } from "react-aria-components";

import type { Size } from "#contracts/enums/size.enum";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { pageActionVariant } from "#core/functions/page-action-variant.function";
import { splitPageActions } from "#core/functions/split-page-actions.function";
import { ActionMenu } from "#react/action-menu/action-menu";
import { Button } from "#react/button/button";
import { SlotIcon } from "#react/slot-icon/slot-icon";

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

/** One shown action: a link drawn as a button when it has somewhere to go, a button otherwise. */
function ActionButton({
  action,
  isPrimary,
  size,
}: {
  readonly action: MenuLeafItem;
  readonly isPrimary: boolean;
  readonly size: Size;
}): ReactElement {
  const variant = pageActionVariant(action, isPrimary);
  if (action.href && !action.isDisabled) {
    return (
      <RouterLink
        href={action.href}
        {...(action.onPress ? { onPress: action.onPress } : {})}
        className={buttonVariants({ variant, size })}
      >
        <SlotIcon icon={action.icon} />
        {action.label}
      </RouterLink>
    );
  }
  return (
    <Button
      variant={variant}
      size={size}
      {...omitUndefined({
        isDisabled: action.isDisabled,
        onPress: action.onPress,
        startIcon: action.icon,
      })}
    >
      {action.label}
    </Button>
  );
}

/** The buttons, the overflow menu and the end slot of a page or section, or nothing when there are none. */
export function PageActions({
  actions,
  moreActionsLabel,
  endContent,
  size = "md",
}: PageActionsProps): ReactElement | null {
  const { visible, overflow } = splitPageActions(actions);
  if (visible.length === 0 && endContent == null) return null;
  return (
    <div data-slot="page-actions" className="flex flex-wrap items-center gap-2">
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
      {endContent}
    </div>
  );
}
