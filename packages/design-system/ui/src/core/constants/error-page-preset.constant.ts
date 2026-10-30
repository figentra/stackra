/**
 * Stackra file contract:
 * Purpose: `ERROR_PAGE_PRESET`, what each `ErrorPage` preset is made of: the `ErrorState` kind it renders, its icon,
 *          and the `ui::error_page` group of its title and description.
 * Boundary: data only; internal, imported by path from `react/` and `native/`. The two icons the state components do
 *           not already draw (`server-crash`, `wifi-off`) are registered by each runtime's `error-page-icons.constant.ts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decision 6); GAPS.md row 31 (owner decision 2026-10-28).
 */
import type { IconName } from "@stackra/icons/contracts";

import type { ErrorStateKind } from "#contracts/enums/error-state-kind.enum";
import type { ErrorPagePreset } from "#contracts/enums/error-page-preset.enum";
import { STATE_ICON } from "#core/constants/state-icon.constant";

/** One preset's parts. */
interface PresetParts {
  /** The `ErrorState` kind. */
  readonly kind: ErrorStateKind;
  /** The icon by name. */
  readonly icon: IconName;
  /** The catalogue group under `ui::error_page`. */
  readonly group: "forbidden" | "not_found" | "server_error" | "offline";
}

/** The parts of each preset. */
export const ERROR_PAGE_PRESET = Object.freeze({
  forbidden: { kind: "forbidden", icon: STATE_ICON.forbidden, group: "forbidden" },
  "not-found": { kind: "not-found", icon: STATE_ICON["not-found"], group: "not_found" },
  "server-error": { kind: "unexpected", icon: "server-crash", group: "server_error" },
  offline: { kind: "unexpected", icon: "wifi-off", group: "offline" },
} as const satisfies Record<ErrorPagePreset, PresetParts>);
