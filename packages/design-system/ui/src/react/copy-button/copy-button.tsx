/**
 * Stackra file contract:
 * Purpose: the web `CopyButton`: an IconButton that writes `value` to the clipboard, then morphs its copy icon into a
 *          success check for two seconds, renames itself "Copied" and announces it through a polite live region.
 * Boundary: needs the async Clipboard API (a secure context); where it is missing or refused nothing happens and the
 *          icon stays. The morph is Motion's, from the theme's `fast` step; reduced motion swaps the icons at once.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); design-system gap inventory row 35; WCAG 2.2
 *          SC 4.1.3 (status messages).
 */
import type { ReactElement } from "react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { VisuallyHidden } from "react-aria-components";

import { COPIED_RESET_MS } from "#core/constants/copied-reset-ms.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import type { CopyButtonProps } from "#react/copy-button/copy-button.props";

const FAST = motionTiming(STACKRA_THEME, "fast");

/** A button that copies a value (an order number, an API key, a link) and confirms it with a check. */
export function CopyButton({
  value,
  label: labelProp,
  copiedLabel: copiedLabelProp,
  onCopy,
  variant = "ghost",
  ...rest
}: CopyButtonProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  // The time of the last copy, so a second copy restarts the two seconds.
  const [copiedAt, setCopiedAt] = useState<number | null>(null);
  const isCopied = copiedAt !== null;
  const label = labelProp ?? t(UI_KEYS.ui.copy_button.copy);
  const copiedLabel = copiedLabelProp ?? t(UI_KEYS.ui.copy_button.copied);

  useEffect(() => {
    if (copiedAt === null) return;
    const timer = setTimeout(() => setCopiedAt(null), COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [copiedAt]);

  const copy = () => {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopiedAt(Date.now());
        onCopy?.(value);
      },
      () => undefined,
    );
  };

  const icon = (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={isCopied ? "check" : "copy"}
        data-slot="copy-button-icon"
        className="inline-flex"
        initial={isReduced ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={isReduced ? { opacity: 0, transition: { duration: 0 } } : { scale: 0.4, opacity: 0 }}
        transition={{ duration: FAST.durationMs / 1000, ease: FAST.bezier ?? "easeOut" }}
      >
        <Icon
          name={isCopied ? "check" : "copy"}
          {...(isCopied ? { tone: "success" as const } : {})}
        />
      </motion.span>
    </AnimatePresence>
  );

  return (
    <>
      <IconButton
        {...rest}
        variant={variant}
        icon={icon}
        label={isCopied ? copiedLabel : label}
        onPress={copy}
      />
      <VisuallyHidden role="status">{isCopied ? copiedLabel : ""}</VisuallyHidden>
    </>
  );
}
