/**
 * Stackra file contract:
 * Purpose: the icons the native components of @stackra/ui draw by themselves (the avatar's person mark, the external
 *          link mark, the action menu's ellipsis, the password field's eye and eye-off, the chevrons, check
 *          mark and sort arrows of lists, tables and pagination, the quantity stepper's minus, plus and trash, the copy mark and the tone icons of alerts and dialogs), registered here so they
 *          show without the app registering them.
 * Boundary: a registry of named re-exports, so a bundler keeps only these; an app's own registry wins for the same
 *          name.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10); ADR 0183 (budgets).
 */
import { defineIconRegistry } from "@stackra/icons";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Camera,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  GripVertical,
  Image,
  ImageOff,
  Images,
  Info,
  Link2,
  Maximize2,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Trash,
  TriangleAlert,
  Upload,
  UserRound,
  X,
} from "@stackra/icons/native/lucide-icons";

/** The icons the native components draw on their own. */
export const UI_ICONS = defineIconRegistry({
  "arrow-down": ArrowDown,
  "arrow-up": ArrowUp,
  "arrow-up-down": ArrowUpDown,
  camera: Camera,
  "chart-column": ChartColumn,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  copy: Copy,
  download: Download,
  ellipsis: Ellipsis,
  "external-link": ExternalLink,
  eye: Eye,
  "eye-off": EyeOff,
  file: File,
  "grip-vertical": GripVertical,
  image: Image,
  "image-off": ImageOff,
  images: Images,
  info: Info,
  "link-2": Link2,
  "maximize-2": Maximize2,
  minus: Minus,
  pencil: Pencil,
  plus: Plus,
  "refresh-cw": RefreshCw,
  "rotate-ccw": RotateCcw,
  "sliders-horizontal": SlidersHorizontal,
  sparkles: Sparkles,
  "table-2": Table2,
  trash: Trash,
  "triangle-alert": TriangleAlert,
  upload: Upload,
  "user-round": UserRound,
  x: X,
});
