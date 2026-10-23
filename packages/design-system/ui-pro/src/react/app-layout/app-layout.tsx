/**
 * Stackra file contract:
 * Purpose: the web `AppLayout` compound on HeroUI Pro's AppLayout: the full-height sidebar, sticky navbar, main
 *          content and optional aside shell, with the parts MenuToggle, AsideTrigger and MobileAside and the
 *          `useAppLayout` hook; every other prop passes through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. Its `sidebar` slot takes a
 *          `Sidebar` of this package, which finds the shell's provider. Imports the `app-layout` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-005.
 */
import {
  AppLayout as HeroAppLayout,
  type AppLayoutRootProps as HeroAppLayoutRootProps,
} from "@heroui-pro/react/app-layout";

import type { AppLayoutContractProps } from "#contracts/types/app-layout-contract-props.type";
import { AppLayoutAsideTrigger } from "#react/app-layout/app-layout-aside-trigger";
import { AppLayoutMenuToggle } from "#react/app-layout/app-layout-menu-toggle";

/** Props of the web AppLayout: the shared contract plus HeroUI Pro's own shell props, passed through unchanged. */
export type AppLayoutProps = AppLayoutContractProps &
  Omit<HeroAppLayoutRootProps, keyof AppLayoutContractProps>;

/** The shell root: HeroUI Pro's `AppLayout.Root`. */
function AppLayoutRoot(props: AppLayoutProps) {
  return <HeroAppLayout.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface AppLayoutParts {
  /** The button that opens the mobile navigation sheet, named by `label`. */
  readonly MenuToggle: typeof AppLayoutMenuToggle;
  /** The button that toggles the aside panel, named by `label`. */
  readonly AsideTrigger: typeof AppLayoutAsideTrigger;
  /** The content of the aside when it is shown as a sheet on a narrow viewport. */
  readonly MobileAside: typeof HeroAppLayout.MobileAside;
}

/**
 * An application shell: `sidebar`, `navbar`, `toolbar`, `aside` and `footer` slots around the main content, with
 * `AppLayout.MenuToggle`, `AppLayout.AsideTrigger` and `AppLayout.MobileAside`.
 */
export const AppLayout: typeof AppLayoutRoot & AppLayoutParts = Object.assign(AppLayoutRoot, {
  MenuToggle: AppLayoutMenuToggle,
  AsideTrigger: AppLayoutAsideTrigger,
  MobileAside: HeroAppLayout.MobileAside,
});

export { useAppLayout } from "@heroui-pro/react/app-layout";
