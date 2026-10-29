/**
 * Stackra file contract:
 * Purpose: `OrderProgressProps`, the props the order-progress Live Activity renders: an `ActivityProgress` without its
 *          deep link, which only the start call takes.
 * Boundary: a type only; serialisable, because expo-widgets hands it to the widget extension.
 * Runtime: react-native
 * Governing contract: ADR 0478 (decision 9); STA-1539.
 */
import type { ActivityProgress } from "#contracts/types/activity-progress.type";

/** What the order-progress activity renders. */
export type OrderProgressProps = Omit<ActivityProgress, "url">;
