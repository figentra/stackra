/**
 * Stackra file contract:
 * Purpose: the root component: gesture handling, safe-area insets, the Stackra design system provider (HeroUI
 *          Native, colour scheme and direction), the icon registry and the navigation container, with the theme
 *          bridged from the Stackra brand colours.
 * Boundary: composes the providers and the navigator; owns no screen and no data.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/native";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  ChevronRight,
  CircleCheck,
  CircleX,
  Download,
  Heart,
  LayoutGrid,
  Minus,
  Moon,
  Pencil,
  Play,
  Plus,
  Search,
  SendHorizontal,
  Settings,
  Sparkles,
  Star,
  Sun,
  Trash,
  Undo2,
} from "@stackra/icons/native/lucide-icons";
import { DesignSystemProvider, useDesignSystem } from "@stackra/ui/native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useThemeColor } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { linking } from "./navigation/linking";
import { RootNavigator } from "./navigation/root-navigator";

void SplashScreen.preventAutoHideAsync();

// shortcut: written by hand, only the icons the screens draw, until gen emits it from the names used (STA-339).
/** The icons the app draws by name, on top of the few `@stackra/ui` draws itself. */
const APP_ICONS = defineIconRegistry({
  archive: Archive,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  bell: Bell,
  calendar: Calendar,
  check: Check,
  "chevron-right": ChevronRight,
  "circle-check": CircleCheck,
  "circle-x": CircleX,
  download: Download,
  heart: Heart,
  "layout-grid": LayoutGrid,
  minus: Minus,
  moon: Moon,
  pencil: Pencil,
  play: Play,
  plus: Plus,
  search: Search,
  "send-horizontal": SendHorizontal,
  settings: Settings,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  trash: Trash,
  "undo-2": Undo2,
});

function Navigation() {
  // The scheme on screen, `system` already resolved, and the direction of the locale: the switchers on the
  // design-system screen change both at runtime.
  const { resolvedColorScheme, direction } = useDesignSystem();
  const dark = resolvedColorScheme === "dark";
  const [background, foreground, accent, border] = useThemeColor([
    "background",
    "foreground",
    "accent",
    "border",
  ]);
  const base = dark ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer
      // React Navigation mirrors its headers, back buttons and gestures from this, not from I18nManager alone.
      direction={direction}
      linking={linking}
      onReady={() => void SplashScreen.hideAsync()}
      theme={{
        ...base,
        colors: {
          ...base.colors,
          background,
          card: background,
          text: foreground,
          primary: accent,
          border,
        },
      }}
    >
      {/* Follows the in-app scheme, not only the device's, so the switcher keeps the status bar readable. */}
      <StatusBar style={dark ? "light" : "dark"} />
      <RootNavigator />
    </NavigationContainer>
  );
}

/** The app's root: gestures, safe-area insets, the design system provider, the icons, then the navigation. */
export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DesignSystemProvider>
          <IconRegistryProvider registry={APP_ICONS}>
            <Navigation />
          </IconRegistryProvider>
        </DesignSystemProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
