/**
 * Stackra file contract:
 * Purpose: `STUDIO_TEMPLATES`: the page templates the studio canvas can show, in switcher order: an id (its label is
 *          `canvas.template_names.<id>`), an icon and the component.
 * Boundary: data only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import type { IconName } from "@stackra/icons/contracts";
import type { ComponentType } from "react";

import { Icons } from "#src/constants/icons.constant";

import { StudioComponentSheet } from "./studio-component-sheet";
import { StudioDashboard } from "./studio-dashboard";
import { StudioMobileScreen } from "./studio-mobile-screen";
import { StudioOnboarding } from "./studio-onboarding";
import { StudioSettingsForm } from "./studio-settings-form";
import { StudioStorefront } from "./studio-storefront";

/** The canvas templates. */
export const STUDIO_TEMPLATES = [
  { id: "dashboard", icon: Icons.LayoutDashboard, Component: StudioDashboard },
  { id: "form", icon: Icons.Settings, Component: StudioSettingsForm },
  { id: "store", icon: Icons.ShoppingBag, Component: StudioStorefront },
  { id: "onboarding", icon: Icons.Rocket, Component: StudioOnboarding },
  { id: "mobile", icon: Icons.Smartphone, Component: StudioMobileScreen },
  { id: "sheet", icon: Icons.LayoutGrid, Component: StudioComponentSheet },
] as const satisfies readonly { id: string; icon: IconName; Component: ComponentType }[];
