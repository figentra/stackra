/**
 * Stackra file contract:
 * Purpose: the notifications panel route of @figentra/playground: its path. The page it renders is
 *          `notifications-panel.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Notifications panel page, at `/notifications-panel`. */
export class NotificationsPanelRoute extends Route({ path: "/notifications-panel" }) {}
