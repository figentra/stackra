/**
 * Stackra file contract:
 * Purpose: the web `SettingsCell`: one setting as a row (an icon tile, the title, a muted line) with its control at
 *          the inline end and, when given, content under it at full width. The family members fill the control.
 * Boundary: drawing only; the title's and description's ids are handed to the control through `SettingsCellIds` so it
 *           is named and described by them. In an ItemCardGroup it drops its frame.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1,
 *          4.1.2.
 */
import { cn } from "@heroui/react";
import { use, useId, type ReactElement, type ReactNode } from "react";

import { Icon } from "#react/icon/icon";
import { ItemCardGroupContext } from "#react/item-card/item-card-group-context";
import type { SettingsCellIds } from "#react/settings-cell/settings-cell-ids.type";
import type { SettingsCellProps } from "#react/settings-cell/settings-cell.props";

/** One setting. `control` may be a function of the title and description ids. */
export function SettingsCell({
  title,
  description,
  icon,
  control,
  children,
  isDisabled,
  className,
}: Omit<SettingsCellProps, "control"> & {
  readonly control?: ReactNode | ((ids: SettingsCellIds) => ReactNode);
}): ReactElement {
  const id = useId();
  const isGrouped = use(ItemCardGroupContext);
  const ids = { title: `${id}-title`, description: description ? `${id}-description` : undefined };
  return (
    <div
      className={
        cn(
          "grid gap-3 px-4 py-3",
          !isGrouped && "rounded-[var(--radius-container)] border border-border bg-surface",
          isDisabled && "opacity-(--opacity-muted)",
          className,
        ) ?? ""
      }
    >
      <div className="flex min-h-8 items-center gap-3">
        {icon ? (
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] bg-default text-foreground"
          >
            <Icon name={icon} size="sm" />
          </span>
        ) : null}
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span id={ids.title} className="font-medium text-foreground">
            {title}
          </span>
          {description ? (
            <span id={ids.description} className="text-sm text-muted">
              {description}
            </span>
          ) : null}
        </div>
        {typeof control === "function" ? control(ids) : control}
      </div>
      {children}
    </div>
  );
}
