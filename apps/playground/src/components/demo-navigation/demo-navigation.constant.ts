/**
 * Stackra file contract:
 * Purpose: `DEMO_NAVIGATION`, the entries of the demo sidebar the Sidebar and AppLayout pages share: the workspace
 *          menu (one expandable item and a count) and the settings entry of the footer.
 * Boundary: data only; entries carry no `href` (the shell's router would rewrite the address).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0305 (rule 10); STA-403 FR-013.
 */
import type { DemoIconName } from "#src/components/demo-icon";

/** One navigation entry; an entry with `children` expands instead of navigating. */
interface NavigationItem {
  readonly id: string;
  readonly label: string;
  readonly icon: DemoIconName;
  readonly count?: string;
  readonly children?: readonly { readonly id: string; readonly label: string }[];
}

const ITEMS: readonly NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "orders", label: "Orders", icon: "doc", count: "12" },
  { id: "customers", label: "Customers", icon: "users" },
  {
    id: "reports",
    label: "Reports",
    icon: "chart",
    children: [
      { id: "reports-overview", label: "Overview" },
      { id: "reports-revenue", label: "Revenue" },
    ],
  },
];

const SETTINGS = { id: "settings", label: "Settings", icon: "gear" } as const;

/** The demo sidebar's entries: the workspace menu, then the settings entry in the footer. */
export const DEMO_NAVIGATION = { items: ITEMS, settings: SETTINGS } as const;
