/**
 * Stackra file contract:
 * Purpose: `ModuleMenuProps`, the props of the web `ModuleMenu`: `@stackra/ui`'s Sidebar props, with `items` an
 *          override of the declared module menus.
 * Boundary: a type only (ADR 0305). The composed parts (`children`) are left out: the module menu always draws the
 *           Sidebar from items.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0111 (decisions 1 and 3); ADR 0317 (decisions 1 and 4).
 */
import type { SidebarProps } from "@stackra/ui/react";

/**
 * The Sidebar's look, collapse, drawer, search and loading props; `items` replaces the declared menus.
 *
 * @example
 * <ModuleMenu label="Main navigation" startContent={<TenantMenu labels={labels} />} isSearchable />
 */
export type ModuleMenuProps = Omit<SidebarProps, "children">;
