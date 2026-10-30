/**
 * Stackra file contract:
 * Purpose: `ChoiceGroupFrame`, the labelled frame around the cards of the native RadioButtonGroup and CheckboxButtonGroup, with its description and error.
 * Boundary: internal; drawing only; the error is a polite live region.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";

import type { Orientation } from "#contracts/enums/orientation.enum";
import { Text } from "#native/text/text";

/** The labelled frame around the cards. */
export function ChoiceGroupFrame({
  label,
  description,
  errorMessage,
  isInvalid,
  orientation,
  role,
  className,
  children,
}: {
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly errorMessage?: ReactNode;
  readonly isInvalid?: boolean | undefined;
  readonly orientation: Orientation;
  readonly role: "radiogroup" | "list";
  readonly className?: string | undefined;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <View className={`gap-2 ${className ?? ""}`}>
      {label == null ? null : <Text className="font-medium">{label}</Text>}
      <View
        accessibilityRole={role}
        {...(typeof label === "string" ? { accessibilityLabel: label } : {})}
        className={`gap-2 ${orientation === "horizontal" ? "flex-row flex-wrap" : ""}`}
      >
        {children}
      </View>
      {description == null ? null : (
        <Text type="small" tone="muted">
          {description}
        </Text>
      )}
      {isInvalid && errorMessage ? (
        <Text type="small" tone="danger" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
