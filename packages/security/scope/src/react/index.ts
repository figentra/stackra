/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/scope (`useScope`, and the scope kit's `ScopePicker`)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./contracts` only. `useScope` serves React DOM
 *           and React Native alike, while `ScopePicker` is a web block over @stackra/ui/react; there is no `./native`
 *           kit yet (one symbol, one entry; an entry is exported once its folder holds a file, ADR 0327 d10).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0327 (decision 10); ADR 0504 (module UI kits); the STA-347
 *                     stand-in barrel decision.
 */
export { ScopePicker } from "#react/scope-picker/scope-picker";
export type { ScopePickerProps } from "#react/scope-picker/scope-picker.props";
export { useScope } from "#react/scope/use-scope";
