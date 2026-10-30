/**
 * Stackra file contract:
 * Purpose: the icons the design-system review area draws by name, and `ReviewIcons`, the registry provider that adds
 *          them for the area's screens, on top of the few `@stackra/ui` draws itself.
 * Boundary: development builds only: the tab navigator reaches the area through `__DEV__` requires, so a release build
 *           drops this registry (the Lucide components themselves stay, since `@stackra/ui` draws its own icons). A
 *           nested `IconRegistryProvider` merges with any parent registry.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10, the icon registry); ADR 0310 (decision 6, the review area).
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/native";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bike,
  BookOpen,
  Calendar,
  ChartColumn,
  Check,
  ChevronRight,
  ChevronsRight,
  CircleCheck,
  CircleX,
  Clock,
  Columns3,
  Download,
  FileCode,
  Globe,
  Heart,
  House,
  Inbox,
  LayoutGrid,
  Lock,
  LockOpen,
  Minus,
  Moon,
  Pause,
  Pencil,
  Pin,
  Play,
  Plus,
  Search,
  Send,
  SendHorizontal,
  Settings,
  Sparkles,
  Star,
  Store,
  Sun,
  Trash,
  Undo2,
} from "@stackra/icons/native/lucide-icons";
import type { ReviewIconsProps } from "./review-icons.props";

// shortcut: written by hand, only the icons the review screens draw, until gen emits it from the names used (STA-339).
const REVIEW_ICONS = defineIconRegistry({
  archive: Archive,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  bell: Bell,
  bike: Bike,
  "book-open": BookOpen,
  calendar: Calendar,
  "chart-column": ChartColumn,
  check: Check,
  "chevron-right": ChevronRight,
  "chevrons-right": ChevronsRight,
  "circle-check": CircleCheck,
  "circle-x": CircleX,
  clock: Clock,
  "columns-3": Columns3,
  download: Download,
  "file-code": FileCode,
  globe: Globe,
  heart: Heart,
  house: House,
  inbox: Inbox,
  "layout-grid": LayoutGrid,
  lock: Lock,
  "lock-open": LockOpen,
  minus: Minus,
  moon: Moon,
  pause: Pause,
  pencil: Pencil,
  pin: Pin,
  play: Play,
  plus: Plus,
  search: Search,
  send: Send,
  "send-horizontal": SendHorizontal,
  settings: Settings,
  sparkles: Sparkles,
  star: Star,
  store: Store,
  sun: Sun,
  trash: Trash,
  "undo-2": Undo2,
});

/** Gives the review area's screens their icons by name. */
export function ReviewIcons({ children }: ReviewIconsProps) {
  return <IconRegistryProvider registry={REVIEW_ICONS}>{children}</IconRegistryProvider>;
}
