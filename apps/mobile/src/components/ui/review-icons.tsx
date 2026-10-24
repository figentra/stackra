/**
 * Stackra file contract:
 * Purpose: the icons the design-system review area draws by name, and `ReviewIcons`, the registry provider that adds
 *          them for the area's screens, on top of the few `@stackra/ui` draws itself.
 * Boundary: development builds only: the tab navigator reaches the area through `__DEV__` requires, so a release build
 *           drops this file and the icons with it. A nested `IconRegistryProvider` merges with any parent registry.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 3, the icon registry); ADR 0310 (decision 6, the review area).
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/native";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  CircleCheck,
  CircleX,
  Download,
  Heart,
  LayoutGrid,
  Moon,
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
import type { ReactNode } from "react";

// shortcut: written by hand, only the icons the review screens draw, until gen emits it from the names used (STA-339).
const REVIEW_ICONS = defineIconRegistry({
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  bell: Bell,
  check: Check,
  "chevron-right": ChevronRight,
  "circle-check": CircleCheck,
  "circle-x": CircleX,
  download: Download,
  heart: Heart,
  "layout-grid": LayoutGrid,
  moon: Moon,
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

/** Gives the review area's screens their icons by name. */
export function ReviewIcons({ children }: { readonly children: ReactNode }) {
  return <IconRegistryProvider registry={REVIEW_ICONS}>{children}</IconRegistryProvider>;
}
