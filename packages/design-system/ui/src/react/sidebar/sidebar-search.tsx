/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.Search`: a filter box whose text is the sidebar's `query`. A Sidebar drawn from `items`
 *          hides the places that do not match; composed parts read `useSidebar().query` to filter their own. It is left
 *          out of the icon rail.
 * Boundary: the house SearchField (Escape and the clear button empty it); `value` and `onChange` take the text over.
 * Runtime: browser
 * Governing contract: ADR 0305; WCAG 2.2 SC 1.3.1 and 4.1.2; owner request 2026-10-29 (STA-1371).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { SearchField } from "#react/search-field/search-field";
import type { SidebarSearchProps } from "#react/sidebar/sidebar-search.props";
import { useSidebar } from "#react/sidebar/use-sidebar";

/** The sidebar's filter box. */
export function SidebarSearch({
  value,
  onChange,
  placeholder,
  className,
  ...rest
}: SidebarSearchProps): ReactElement | null {
  const t = useUiText();
  const { query, setQuery, isRail } = useSidebar();
  if (isRail) return null;
  const name = t(UI_KEYS.ui.sidebar.search);
  return (
    <SearchField
      aria-label={name}
      {...rest}
      isFullWidth
      placeholder={placeholder ?? name}
      value={value ?? query}
      onChange={(next) => {
        setQuery(next);
        onChange?.(next);
      }}
      className={cn("w-full", typeof className === "string" ? className : "") ?? ""}
    />
  );
}
