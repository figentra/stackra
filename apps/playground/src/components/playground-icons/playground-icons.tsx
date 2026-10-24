/**
 * Stackra file contract:
 * Purpose: gives every playground page the icons it draws, by name: a registry of only the icons the pages use, so the
 *          entry does not carry the whole Lucide set (ADR 0183, about 200 KB gzipped for the entry).
 * Boundary: the registry and its provider only. A page that draws an icon adds its name here; a page with a custom
 *          icon of its own nests a provider of its own. Gen will emit this registry from the names the declarations
 *          use, and refuse an unknown one (STA-339); until then it is written by hand.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0183 (budgets).
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Bell,
  Building,
  Check,
  ChevronRight,
  CircleCheck,
  CircleX,
  CornerDownLeft,
  Download,
  Droplet,
  Heart,
  Languages,
  Layers,
  LayoutGrid,
  Monitor,
  Moon,
  Play,
  Plus,
  Search,
  SendHorizontal,
  Settings,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Square,
  Star,
  Sun,
  Trash,
  Undo2,
} from "@stackra/icons/react/lucide-icons";
import type { ReactNode } from "react";

/** The icons the playground pages draw, by name. */
const PLAYGROUND_ICONS = defineIconRegistry({
  "arrow-down": ArrowDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  "arrow-up-right": ArrowUpRight,
  bell: Bell,
  building: Building,
  check: Check,
  "chevron-right": ChevronRight,
  "circle-check": CircleCheck,
  "circle-x": CircleX,
  "corner-down-left": CornerDownLeft,
  download: Download,
  droplet: Droplet,
  heart: Heart,
  languages: Languages,
  layers: Layers,
  "layout-grid": LayoutGrid,
  monitor: Monitor,
  moon: Moon,
  play: Play,
  plus: Plus,
  search: Search,
  "send-horizontal": SendHorizontal,
  settings: Settings,
  "shopping-cart": ShoppingCart,
  snowflake: Snowflake,
  sparkles: Sparkles,
  square: Square,
  star: Star,
  sun: Sun,
  trash: Trash,
  "undo-2": Undo2,
});

/** Props of {@link PlaygroundIcons}. */
export interface PlaygroundIconsProps {
  /** The tree whose pages draw icons. */
  children: ReactNode;
}

/** Provides the playground's icon registry to everything below it. */
export function PlaygroundIcons({ children }: PlaygroundIconsProps) {
  return <IconRegistryProvider registry={PLAYGROUND_ICONS}>{children}</IconRegistryProvider>;
}
