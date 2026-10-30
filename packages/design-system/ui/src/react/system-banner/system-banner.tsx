/**
 * Stackra file contract:
 * Purpose: the web `SystemBanner`: an app-wide message on the `Alert` (default the accent tone) with an optional
 *          dismiss button at its inline end; it slides down from the top as it mounts and collapses its height on
 *          dismiss, then calls `onDismiss`. Reduced motion shows and removes it at once.
 * Boundary: generalises `EnvironmentBanner` (which stays persistent); the caller places it above the app and remembers
 *           a dismiss. Announced as the Alert's tone announces. The dismiss label defaults to the `ui` catalogue.
 * Runtime: browser
 * Governing contract: gap inventory row 27 (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312; WCAG 2.2
 *          SC 2.3.3.
 */
import { cn } from "@heroui/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { Alert } from "#react/alert/alert";
import { CloseButton } from "#react/close-button/close-button";
import { useUiText } from "#react/hooks/use-ui-text";
import type { SystemBannerProps } from "#react/system-banner/system-banner.props";

const ENTER = motionTiming(STACKRA_THEME, "reveal");
const EXIT = motionTiming(STACKRA_THEME, "base");

/** How far the banner drops in from, in px. */
const DROP = 12;

/** An app-wide message that slides in from the top and collapses away when dismissed. */
export function SystemBanner({
  tone = "accent",
  isDismissible = true,
  onDismiss,
  dismissLabel,
  className,
  ...rest
}: SystemBannerProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const [isOpen, setOpen] = useState(true);
  return (
    <AnimatePresence {...(onDismiss ? { onExitComplete: onDismiss } : {})}>
      {isOpen ? (
        <motion.div
          key="system-banner"
          data-slot="system-banner"
          className="relative overflow-hidden"
          initial={isReduced ? false : { opacity: 0, y: -DROP, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{
            opacity: 0,
            height: 0,
            transition: { duration: isReduced ? 0 : EXIT.durationMs / 1000, ease: "easeIn" },
          }}
          transition={{ duration: ENTER.durationMs / 1000, ease: ENTER.bezier ?? "easeOut" }}
        >
          <Alert {...rest} tone={tone} className={cn(isDismissible && "pe-12", className) ?? ""} />
          {isDismissible ? (
            <CloseButton
              className="absolute end-2 top-2"
              label={dismissLabel ?? t(UI_KEYS.ui.system_banner.dismiss)}
              onPress={() => setOpen(false)}
            />
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
