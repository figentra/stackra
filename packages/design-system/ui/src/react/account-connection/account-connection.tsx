/**
 * Stackra file contract:
 * Purpose: the web `AccountConnection`: a `Card` row with the service's logo, name and description, a `StatusBadge`
 *          (success "connected" with the account's name, or neutral "not connected") and one `Button` to connect or
 *          disconnect, with an optional terms footnote. When the state changes, the status and the button cross-fade
 *          with Motion at the theme's `fast` step (at once under reduced motion), and the status is announced.
 * Boundary: builds on `#react/card/card`, `#react/status-badge/status-badge`, `#react/button/button` and
 *           `#react/text/text`; the connecting itself is the app's. Every caller word comes in as a prop. The row wraps
 *           on a narrow screen and follows the reading direction.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); design-system gap inventory row 38; WCAG 2.2
 *          SC 1.4.10, 4.1.3.
 */
import type { ReactElement } from "react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Button } from "#react/button/button";
import { Card } from "#react/card/card";
import { StatusBadge } from "#react/status-badge/status-badge";
import { Text } from "#react/text/text";
import type { AccountConnectionProps } from "#react/account-connection/account-connection.props";

const FAST = motionTiming(STACKRA_THEME, "fast");
const TRANSITION = { duration: FAST.durationMs / 1000, ease: FAST.bezier ?? "easeOut" } as const;

/** An external service the store can connect an account to, with its state and the one action that changes it. */
export function AccountConnection({
  title,
  description,
  logo,
  isConnected,
  accountName,
  connectedLabel,
  disconnectedLabel,
  connectLabel,
  disconnectLabel,
  isLoading,
  details,
  onConnect,
  onDisconnect,
  ...rest
}: AccountConnectionProps): ReactElement {
  const isReduced = useReducedMotion() ?? false;

  return (
    <Card {...rest} data-slot="account-connection">
      <div className="flex flex-wrap items-center gap-4">
        {logo === undefined ? null : <div aria-hidden>{logo}</div>}
        <div className="grid min-w-0 flex-1 gap-1">
          <Text className="font-medium">{title}</Text>
          {description === undefined ? null : (
            <Text type="small" tone="muted">
              {description}
            </Text>
          )}
          <div role="status" className="flex flex-wrap items-center gap-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isConnected ? "on" : "off"}
                className="flex flex-wrap items-center gap-2"
                initial={isReduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={isReduced ? { duration: 0 } : TRANSITION}
              >
                <StatusBadge tone={isConnected ? "success" : "default"} size="sm">
                  {isConnected ? connectedLabel : disconnectedLabel}
                </StatusBadge>
                {isConnected && accountName ? (
                  <Text type="small" tone="muted" isTruncated>
                    {accountName}
                  </Text>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <Button
          variant={isConnected ? "secondary" : "primary"}
          {...omitUndefined({ isLoading, onPress: isConnected ? onDisconnect : onConnect })}
        >
          {isConnected ? disconnectLabel : connectLabel}
        </Button>
      </div>
      {details === undefined ? null : (
        <Text type="caption" tone="muted" className="mt-3">
          {details}
        </Text>
      )}
    </Card>
  );
}
