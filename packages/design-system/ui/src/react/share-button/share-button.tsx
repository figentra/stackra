/**
 * Stackra file contract:
 * Purpose: the web `ShareButton`: opens the system share sheet (`navigator.share`) with the link, title and text;
 *          where the browser has none (most desktops), copies the link instead and says "Link copied" with a check for
 *          two seconds. Without a sheet its default words are "Copy link" and it draws a link.
 * Boundary: composes Button or IconButton. Closing the sheet is not an error and calls nothing. The copy is announced
 *           in a polite status region; the icon's swap is instant, so nothing moves under reduced motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2 and 4.1.3; STA-1371 (wave C).
 */
import { useEffect, useState, type ReactElement } from "react";
import { VisuallyHidden } from "react-aria-components";

import { ATTACHMENT_KEYS } from "#core/constants/attachment-keys.constant";
import { COPIED_RESET_MS } from "#core/constants/copied-reset-ms.constant";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import type { ShareButtonProps } from "#react/share-button/share-button.props";

/** The button's words. */
const K = ATTACHMENT_KEYS.ui.share_button;

/** Shares a link through the system sheet, or copies it where there is none. */
export function ShareButton({
  url,
  title,
  text,
  label,
  isIconOnly = false,
  variant,
  size,
  isDisabled,
  onShare,
  className,
}: ShareButtonProps): ReactElement {
  const t = useUiText();
  const [copiedAt, setCopiedAt] = useState<number | null>(null);
  const isCopied = copiedAt !== null;
  const hasSheet = typeof navigator !== "undefined" && typeof navigator.share === "function";
  // Without a share sheet the button copies, so by default it says so ("Copy link") and draws a link.
  const name = isCopied ? t(K.copied) : (label ?? t(hasSheet ? K.share : K.copy_link));

  useEffect(() => {
    if (copiedAt === null) return;
    const timer = setTimeout(() => setCopiedAt(null), COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [copiedAt]);

  const share = () => {
    const data = {
      ...(url === undefined ? {} : { url }),
      ...(title === undefined ? {} : { title }),
      ...(text === undefined ? {} : { text }),
    };
    if (hasSheet && (navigator.canShare?.(data) ?? true)) {
      // A rejection is the person closing the sheet (AbortError) or a refused share: neither is shared.
      navigator.share(data).then(
        () => onShare?.("shared"),
        () => undefined,
      );
      return;
    }
    navigator.clipboard?.writeText(url ?? text ?? "").then(
      () => {
        setCopiedAt(Date.now());
        onShare?.("copied");
      },
      () => undefined,
    );
  };

  const icon = (
    <Icon
      name={isCopied ? "check" : hasSheet ? "share-2" : "link"}
      {...(isCopied ? { tone: "success" as const } : {})}
    />
  );
  return (
    <>
      {isIconOnly ? (
        <IconButton
          icon={icon}
          label={name}
          variant={variant ?? "ghost"}
          {...(size === undefined ? {} : { size })}
          isDisabled={isDisabled ?? false}
          onPress={share}
          {...(className === undefined ? {} : { className })}
        />
      ) : (
        <Button
          startIcon={icon}
          variant={variant ?? "secondary"}
          {...(size === undefined ? {} : { size })}
          isDisabled={isDisabled ?? false}
          onPress={share}
          {...(className === undefined ? {} : { className })}
        >
          {name}
        </Button>
      )}
      <VisuallyHidden role="status">{isCopied ? t(K.copied) : ""}</VisuallyHidden>
    </>
  );
}
