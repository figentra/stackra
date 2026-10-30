/**
 * Stackra file contract:
 * Purpose: the native `ShareButton`: opens the system share sheet (React Native's `Share`) with the link, title and
 *          text.
 * Boundary: composes Button or IconButton. Android takes the link inside the message, so the message is the text and
 *           the link together; iOS takes the link on its own too. Closing the sheet calls nothing.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C).
 */
import type { ReactElement } from "react";
import { Share } from "react-native";

import { ATTACHMENT_KEYS } from "#core/constants/attachment-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { IconButton } from "#native/icon-button/icon-button";
import type { ShareButtonProps } from "#native/share-button/share-button.props";

/** The button's words. */
const K = ATTACHMENT_KEYS.ui.share_button;

/** Shares a link through the system sheet. */
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
  const name = label ?? t(K.share);

  const share = () => {
    const message = [text, url].filter(Boolean).join(" ");
    Share.share(
      {
        message,
        ...(url === undefined ? {} : { url }),
        ...(title === undefined ? {} : { title }),
      },
      title === undefined ? {} : { dialogTitle: title, subject: title },
    ).then(
      (result) => {
        if (result.action === Share.sharedAction) onShare?.("shared");
      },
      () => undefined,
    );
  };

  return isIconOnly ? (
    <IconButton
      icon="share-2"
      label={name}
      variant={variant ?? "ghost"}
      {...(size === undefined ? {} : { size })}
      isDisabled={isDisabled ?? false}
      onPress={share}
      {...(className === undefined ? {} : { className })}
    />
  ) : (
    <Button
      startIcon="share-2"
      variant={variant ?? "secondary"}
      {...(size === undefined ? {} : { size })}
      isDisabled={isDisabled ?? false}
      onPress={share}
      {...(className === undefined ? {} : { className })}
    >
      {name}
    </Button>
  );
}
