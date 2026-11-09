/**
 * Stackra file contract:
 * Purpose: `ModuleMenuProps`, the props of the native `ModuleMenu`: the places, by default the declared module menus,
 *          and the spoken name of the list.
 * Boundary: a type only (ADR 0305): `@stackra/ui`'s native NavigationList props with `items` optional; the `View`'s
 *           own props pass through.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0111 (decisions 1 and 3); ADR 0317 (decisions 1 and 7).
 */
import type { NavigationItem } from "@stackra/ui/contracts";
import type { NavigationListProps } from "@stackra/ui/native";

/**
 * The list's name and places; `items` replaces the declared menus.
 *
 * @example
 * <ModuleMenu label="Main navigation" />
 */
export type ModuleMenuProps = Omit<NavigationListProps, "items"> & {
  /** Override; by default the declared module menus (ADR 0111 decision 1) are read. */
  readonly items?: readonly NavigationItem[] | undefined;
};
