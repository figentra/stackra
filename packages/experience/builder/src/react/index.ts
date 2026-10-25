/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/builder (`useEditor`, `useSelection`, `useInspector`, `useSharedEditor`
 *          and the Yjs binding `bindSharedDocument`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./contracts` only; the one entry that loads
 *           React and Yjs (optional peers). The hooks render no chrome and touch no DOM, so React Native builders
 *           import them from here too: there is no `./native` entry (one symbol, one entry).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { useEditor } from "#react/editor/use-editor";
export { useInspector } from "#react/inspector/use-inspector";
export { useSelection } from "#react/selection/use-selection";
export { bindSharedDocument } from "#react/shared-editor/bind-shared-document.function";
export { useSharedEditor } from "#react/shared-editor/use-shared-editor";
