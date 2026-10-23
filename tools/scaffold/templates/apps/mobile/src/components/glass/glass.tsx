/**
 * Stackra file contract:
 * Purpose: a Liquid Glass panel on iOS 26 and later, and a plain surface everywhere else.
 * Boundary: presentation only.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 14).
 */
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { View } from "react-native";

const glass = isLiquidGlassAvailable();

/** Props of {@link Glass}. */
export interface GlassProps {
  /** The panel's content. */
  children: ReactNode;
}

/** A Liquid Glass panel on iOS 26+; a plain surface everywhere else (Android, older iOS, web). */
export function Glass({ children }: GlassProps) {
  if (glass)
    return (
      <GlassView glassEffectStyle="regular" isInteractive style={{ borderRadius: 24, padding: 20 }}>
        {children}
      </GlassView>
    );
  return <View className="rounded-3xl bg-surface p-5">{children}</View>;
}
