/**
 * Stackra file contract:
 * Purpose: the home's list of categories (every category with a built entry), by width: on a phone (below `sm`) one
 *          `CategoryShelf` per category, its built components a swipeable row of big cards under a header with
 *          "View all"; from `sm` the group cards, two per row, three from `lg`.
 * Boundary: presentation over the registry; the width comes from `useBreakpoint` (the window's, Tailwind's edges).
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 3.2 (Home); ADR 0461 (charts moved to Pro);
 *          STA-1371 (listing by width, 2026-10-28).
 */
import { byCategory, CATEGORIES } from "@stackra/showcase";
import { useBreakpoint } from "@stackra/ui/react";

import { CategoryShelf } from "#src/components/category-shelf";
import { GroupCard } from "#src/components/group-card";

/** The categories with at least one built entry, each with its built entries. */
const FILLED = CATEGORIES.map(({ id }) => ({
  id,
  built: byCategory(id).filter((entry) => entry.status !== "planned"),
})).filter(({ built }) => built.length > 0);

/** The categories as phone shelves or as group cards. */
export function CategoryOverview() {
  const isPhone = useBreakpoint().breakpoint === undefined;
  return isPhone ? (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10">
      {FILLED.map(({ id, built }) => (
        <CategoryShelf key={id} category={id} entries={built} headingLevel={3} />
      ))}
    </div>
  ) : (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FILLED.map(({ id }) => (
        <li key={id} className="grid">
          <GroupCard category={id} />
        </li>
      ))}
    </ul>
  );
}
