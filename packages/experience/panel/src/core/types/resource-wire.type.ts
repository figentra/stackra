/**
 * Stackra file contract:
 * Purpose: `ResourceWire`, one resource tree as JSON: its options, table, views, form, infolist, relations and placed
 *          buttons with every class as its versioned key and every enum as its definition. Gen writes it under
 *          `ui.resources` in the manifest; a server can send it, and native or the web draw it once decoded.
 * Boundary: a type only (`Wire<ResourceTree>`); `encodeResource` writes it, `decodeResource` checks it against
 *           `ResourceWire$` and turns the keys back into the client refs. A manifest entry's extra fields (`module`,
 *           `class`, `from`) are not part of it and are dropped on decode.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 5 and 7); ADR 0164 (decision 2); the SDUI catalogue case `resources`
 *                     (STA-1981, build-list item 54).
 */
import type { ResourceTree } from "#core/types/resource-tree.type";
import type { Wire } from "#core/types/wire.type";

/** One resource tree as JSON. */
export type ResourceWire = Wire<ResourceTree>;
