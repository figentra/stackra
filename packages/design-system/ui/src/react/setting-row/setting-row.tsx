/**
 * Stackra file contract:
 * Purpose: the web `SettingRow`, an options tile: an icon, the title and description at the inline start and the house
 *          Switch (or the caller's `action`) at the inline end; while the switch is on, `detail` opens under the row
 *          with a height-and-fade on Motion, the theme's `base` step.
 * Boundary: no styling of its own beyond the row layout. The switch is named by the title and described by the
 *           description (`aria-labelledby`, `aria-describedby`), so it is read as one setting; it keeps HeroUI's
 *           keyboard and React Aria semantics. Reduced motion opens the detail at once. Logical classes (`start`,
 *           `end`, `gap`) mirror it in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); ADR 0060 (right-to-left);
 *          WCAG 2.2 SC 1.3.1, 2.3.3, 4.1.2; design-system gap inventory row 37.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import { Switch } from "#react/switch/switch";
import { Text } from "#react/text/text";
import type { SettingRowProps } from "#react/setting-row/setting-row.props";

const BASE = motionTiming(STACKRA_THEME, "base");

/** The closed detail: no height, no opacity. */
const CLOSED = { height: 0, opacity: 0 } as const;

/** One setting: its words, its switch or action, and the detail that opens while it is on. */
export function SettingRow({
  title,
  description,
  icon,
  value,
  defaultValue,
  onChange,
  isDisabled,
  action,
  detail,
  className,
  ...rest
}: SettingRowProps): ReactElement {
  const id = useId();
  const isReduced = useReducedMotion() ?? false;
  const [held, setHeld] = useState(defaultValue ?? false);
  const isOn = value ?? held;
  const hasSwitch = value !== undefined || defaultValue !== undefined || onChange !== undefined;
  const change = (next: boolean) => {
    setHeld(next);
    onChange?.(next);
  };

  return (
    <div {...rest} className={cn("grid gap-3 py-3", className)}>
      <div className="flex items-center gap-3">
        {icon ? (
          <span aria-hidden className="shrink-0 text-muted">
            <SlotIcon icon={icon} />
          </span>
        ) : null}
        <div className="grid min-w-0 flex-1 gap-0.5">
          <Text id={`${id}-title`} className="font-medium">
            {title}
          </Text>
          {description ? (
            <Text id={`${id}-description`} type="small" tone="muted">
              {description}
            </Text>
          ) : null}
        </div>
        {hasSwitch ? (
          <Switch
            value={isOn}
            onChange={change}
            aria-labelledby={`${id}-title`}
            {...(description ? { "aria-describedby": `${id}-description` } : {})}
            {...omitUndefined({ isDisabled })}
          />
        ) : (
          action
        )}
      </div>
      <AnimatePresence initial={false}>
        {detail && isOn ? (
          <motion.div
            key="detail"
            className="overflow-hidden"
            initial={isReduced ? false : CLOSED}
            animate={{ height: "auto", opacity: 1 }}
            {...(isReduced ? {} : { exit: CLOSED })}
            transition={{ duration: BASE.durationMs / 1000, ease: BASE.bezier ?? "easeInOut" }}
          >
            {detail}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
