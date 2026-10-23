/**
 * Stackra file contract:
 * Purpose: a titled block of a screen: a heading, an optional muted description and the content, so every page of
 *          the design-system review area sections its states the same way.
 * Boundary: one presentational component; no state, no data and no navigation.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-403 FR-013.
 */
import { Typography } from "heroui-native";
import type { ReactNode } from "react";
import { View } from "react-native";

/** Props of {@link Section}. */
export interface SectionProps {
  /** The heading text, read by screen readers as a heading. */
  title: string;
  /** A sentence under the heading that says what the block shows. */
  description?: string;
  /** The content of the block. */
  children: ReactNode;
}

/** A titled block: heading, optional description, then the content, spaced the same on every screen. */
export function Section({ title, description, children }: SectionProps) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Typography.Heading type="h4" accessibilityRole="header">
          {title}
        </Typography.Heading>
        {description ? (
          <Typography.Paragraph type="body-sm" color="muted">
            {description}
          </Typography.Paragraph>
        ) : null}
      </View>
      {children}
    </View>
  );
}
