/**
 * Stackra file contract:
 * Purpose: the actions of the web `Section`: the first three as small buttons (the first primary, the next two
 *          secondary), the rest in an ActionMenu named by `moreActionsLabel`, then the section's end slot. An action with
 *          an `href` is a link drawn as a button, so it navigates through the nearest `RouterProvider`; one with only
 *          `onPress` is a button.
 * Boundary: reached from `Section` only; the barrel does not export it. It builds on the earlier waves' Button and
 *           ActionMenu and the core split, never on PageHeader, a sibling of its wave (ADR 0314 decision 4). A disabled
 *           action is always a button, so it leaves the tab order like every disabled button. The link-as-button is
 *           React Aria's `Link` with HeroUI's `buttonVariants`, the composition HeroUI documents for a router link.
 * Runtime: browser
 * Governing contract: ADR 0314 (decisions 1 and 4); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 2.5.8.
 */
import { buttonVariants } from "@heroui/react";
import type { ReactElement, ReactNode } from "react";
import { Link as RouterLink } from "react-aria-components";

import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { pageActionVariant } from "#core/functions/page-action-variant.function";
import { splitPageActions } from "#core/functions/split-page-actions.function";
import { ActionMenu } from "#react/action-menu/action-menu";
import { Button } from "#react/button/button";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** Props of {@link SectionActions}. */
interface SectionActionsProps {
  /** The section's actions in priority order. */
  readonly actions: readonly MenuLeafItem[];
  /** The accessible name of the overflow menu's button. */
  readonly moreActionsLabel: string;
  /** A node drawn after the actions. */
  readonly endContent?: ReactNode;
}

/** One shown action: a link drawn as a button when it has somewhere to go, a button otherwise. */
function ActionButton({
  action,
  isPrimary,
}: {
  readonly action: MenuLeafItem;
  readonly isPrimary: boolean;
}): ReactElement {
  const variant = pageActionVariant(action, isPrimary);
  if (action.href && !action.isDisabled) {
    return (
      <RouterLink
        href={action.href}
        {...(action.onPress ? { onPress: action.onPress } : {})}
        className={buttonVariants({ variant, size: "sm" })}
      >
        <SlotIcon icon={action.icon} />
        {action.label}
      </RouterLink>
    );
  }
  return (
    <Button
      variant={variant}
      size="sm"
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

/** The buttons, the overflow menu and the end slot of a section, or nothing when there are none. */
export function SectionActions({
  actions,
  moreActionsLabel,
  endContent,
}: SectionActionsProps): ReactElement | null {
  const { visible, overflow } = splitPageActions(actions);
  if (visible.length === 0 && endContent == null) return null;
  return (
    <div data-slot="section-actions" className="flex flex-wrap items-center gap-2">
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
      {endContent}
    </div>
  );
}
