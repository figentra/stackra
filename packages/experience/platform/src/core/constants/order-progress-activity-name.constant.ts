/**
 * Stackra file contract:
 * Purpose: `ORDER_PROGRESS_ACTIVITY_NAME`, the name the order-progress Live Activity is registered under in
 *          expo-widgets and in the app config's widget list, which the server's APNs pushes repeat in their content.
 * Boundary: internal data, shared by the device layout and the server push so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 9); STA-1539.
 */

/** The registered name of the order-progress Live Activity. */
export const ORDER_PROGRESS_ACTIVITY_NAME = "OrderProgress";
