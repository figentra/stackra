/**
 * Stackra file contract:
 * Purpose: `SlotFillIR`, one slot fill discovery read from an exported `fillSlot(Slot, Component, { surface })`: its
 *          const name and place, the slot it names (by its const and import), its surface and the props record of
 *          the slot type it was compiled against.
 * Boundary: a type only. The slot key is resolved later (`slotOf`), from the member's own slots or a dependency's
 *           committed manifest, never from the dependency's source.
 * Runtime: isomorphic
 * Governing contract: ADR 0438; ADR 0260 (a dependency is read from its manifest); app-shells-edge-and-extension.md 7.2.
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** A fill a member declares. */
export interface SlotFillIR {
  /** The exported const name. */
  readonly name: string;

  /** The file, relative to the member root. */
  readonly file: string;

  /** The 1-based line of the declaration. */
  readonly line: number;

  /** The 1-based column of the declaration. */
  readonly column: number;

  /** The slot const and the specifier it is imported from (`@os/console-shell`, or an own `#…` path). */
  readonly slot: ClassRef;

  /** The surface code the fill states. */
  readonly surface: string;

  /** Prop name (`name?` when optional) to its type text, from the slot type the fill was compiled against. */
  readonly props: Readonly<Record<string, string>>;
}
