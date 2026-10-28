/**
 * Stackra file contract:
 * Purpose: `CASH_DRAWER_MODULE`, the name the package's Expo module registers (`Name("StackraCashDrawer")` in the
 *          Swift and Kotlin), which the drivers look up in the app's modules registry.
 * Boundary: internal data; it must equal the `Name` of `ios/StackraCashDrawerModule.swift` and
 *           `android/.../StackraCashDrawerModule.kt`.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 2).
 */

/** The Expo module name. */
export const CASH_DRAWER_MODULE = "StackraCashDrawer";
