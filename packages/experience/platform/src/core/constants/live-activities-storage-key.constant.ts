/**
 * Stackra file contract:
 * Purpose: `LIVE_ACTIVITIES_STORAGE_KEY`, the `prefs` key under which the Expo driver keeps each running activity's
 *          ActivityKit id by the product's reference, so an activity started before a relaunch is found again.
 * Boundary: internal data; the value is a JSON object of reference to id, pruned to the activities still running.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 2: the prefs area); STA-1539.
 */

/** Where the running activities' ids are kept. */
export const LIVE_ACTIVITIES_STORAGE_KEY = "platform.live_activities";
