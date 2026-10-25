/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/builder (the editor node, the change kinds and
 *          changes an editor applies, its state and options, the inspector and its field descriptors) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package and
 *           no CRDT library (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { EditorChangeKind } from "#contracts/enums/editor-change-kind.enum";
export { InspectorFieldKind } from "#contracts/enums/inspector-field-kind.enum";
export type { EditorChange } from "#contracts/types/editor-change.type";
export type { EditorNode } from "#contracts/types/editor-node.type";
export type { EditorOptions } from "#contracts/types/editor-options.type";
export type { EditorState } from "#contracts/types/editor-state.type";
export type { Inspector } from "#contracts/types/inspector.type";
export type { InspectorField } from "#contracts/types/inspector-field.type";
