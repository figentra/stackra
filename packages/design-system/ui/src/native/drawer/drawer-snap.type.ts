/**
 * Stackra file contract:
 * Purpose: `DrawerSnap`, what a native bottom drawer with two or more snap points tells its resize handle: the snap
 *          point it rests at, how many there are, and how to move to another.
 * Boundary: types only; `Drawer` provides it through `DrawerSnapContext`, `DrawerHandle` reads it.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12: one declaration per file); STA-1371 (drawer resize on native).
 */

/** The snap state of an open bottom drawer. */
export interface DrawerSnap {
  /** The snap point the sheet rests at, from 0 (the smallest). */
  readonly index: number;
  /** How many snap points there are. */
  readonly count: number;
  /** Moves the sheet to a snap point, clamped to the ones there are. */
  readonly snapTo: (index: number) => void;
}
