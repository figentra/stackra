/**
 * Stackra file contract:
 * Purpose: the web `Alert` on HeroUI v3's Alert: an inline status message with a tone, a title, an optional
 *          description, an icon and optional actions. The tone is HeroUI's `status`; the icon is the tone's own or the
 *          caller's, from `@stackra/icons`, with `false` for none; the actions sit under the description in a wrapping
 *          row, which HeroUI's Alert has no slot for.
 * Boundary: HeroUI's Alert sets no role, so the component adds the tone's live-region attributes (`alert` for warning
 *           and danger, `status` for the rest); the caller cannot set them, and an alert that is already on the page
 *           when it loads is not announced, only one that appears afterwards.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 and 3); WCAG 2.2 SC 1.4.1
 *          and 4.1.3.
 */
import { Alert as HeroAlert, type AlertRootProps as HeroAlertRootProps } from "@heroui/react";
import type { ComponentPropsWithoutRef, ReactElement } from "react";

import type { AlertContractProps } from "#contracts/types/alert-contract-props.type";
import { liveRegionOf } from "#core/functions/live-region-of.function";
import { FeedbackIcon } from "#react/feedback-icon/feedback-icon";

/**
 * Props of the web Alert: the shared contract plus HeroUI v3's own alert props and the attributes of a `div`, passed
 * through. HeroUI's `status` is the contract's `tone`, its `title` (the HTML tooltip) is the contract's `title`, and
 * the role is the tone's, never the caller's.
 */
export type AlertProps = AlertContractProps &
  Omit<
    HeroAlertRootProps<"div"> &
      Omit<ComponentPropsWithoutRef<"div">, keyof HeroAlertRootProps<"div">>,
    keyof AlertContractProps | "children" | "status" | "role" | "aria-live"
  >;

/** An inline message: the tone's icon, the title, the description and the actions, announced by its tone. */
export function Alert({
  tone = "default",
  title,
  description,
  icon,
  actions,
  ...rest
}: AlertProps): ReactElement {
  return (
    <HeroAlert {...rest} {...liveRegionOf(tone)} status={tone}>
      {icon === false ? null : (
        <HeroAlert.Indicator>
          <FeedbackIcon tone={tone} icon={icon} />
        </HeroAlert.Indicator>
      )}
      <HeroAlert.Content>
        <HeroAlert.Title>{title}</HeroAlert.Title>
        {description == null ? null : <HeroAlert.Description>{description}</HeroAlert.Description>}
        {actions == null ? null : (
          <div data-slot="alert-actions" className="mt-2 flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </HeroAlert.Content>
    </HeroAlert>
  );
}
