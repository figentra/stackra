/**
 * Stackra file contract:
 * Purpose: the native `Alert` on HeroUI Native's Alert: an inline status message with a tone, a title, an optional
 *          description, an icon and optional actions. The tone is HeroUI Native's `status`; the icon is the tone's own
 *          or the caller's, from `@stackra/icons`, with `false` for none; the actions sit under the description in a
 *          wrapping row, which HeroUI Native's Alert has no slot for.
 * Boundary: HeroUI Native gives every alert `role="alert"`; the component replaces it with the tone's live-region
 *           attributes (`alert` and assertive for warning and danger, `status` and polite for the rest), and the caller
 *           cannot set them. The title and the description are wrapped in `Text` by HeroUI Native's parts, so a plain
 *           string is fine there; the actions are elements (a `Button`), because a bare string in a `View` is an error.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 and 3); WCAG 2.2 SC 1.4.1
 *          and 4.1.3.
 */
import { Alert as HeroAlert, type AlertRootProps as HeroAlertRootProps } from "heroui-native";
import { View } from "react-native";
import type { ReactElement } from "react";

import type { AlertContractProps } from "#contracts/types/alert-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import { liveRegionOf } from "#core/functions/live-region-of.function";
import { FeedbackIcon } from "#native/feedback-icon/feedback-icon";

/**
 * Props of the native Alert: the shared contract plus HeroUI Native's own alert props, passed through. HeroUI's
 * `status` is the contract's `tone`, and the role and live region are the tone's, never the caller's.
 */
export type AlertProps = AlertContractProps &
  DistributiveOmit<
    HeroAlertRootProps,
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
          <View className="mt-2 flex-row flex-wrap items-center gap-2">{actions}</View>
        )}
      </HeroAlert.Content>
    </HeroAlert>
  );
}
