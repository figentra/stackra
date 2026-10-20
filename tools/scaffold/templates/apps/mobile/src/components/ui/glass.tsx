import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { View } from "react-native";

const glass = isLiquidGlassAvailable();

/** A Liquid Glass panel on iOS 26+; a plain surface everywhere else (Android, older iOS, web). */
export function Glass({ children }: { children: ReactNode }) {
  if (glass)
    return (
      <GlassView glassEffectStyle="regular" isInteractive style={{ borderRadius: 24, padding: 20 }}>
        {children}
      </GlassView>
    );
  return <View className="rounded-3xl bg-surface p-5">{children}</View>;
}
