/**
 * Stackra file contract:
 * Purpose: `FileHandlingCapability`, the `fileHandling` facet (capability `file_handling`): the files the operating
 *          system handed to the app at its latest launch (the PWA's `launchQueue`, a manifest `file_handlers` entry).
 * Boundary: a type only. Only the latest launch is kept: a new launch replaces the list.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); ADR 0255 (file handlers).
 */
import type { ReadonlySignal } from "#contracts/types/readonly-signal.type";

/** Files opened with the app. */
export interface FileHandlingCapability {
  /** The files of the latest launch; empty when the app was opened another way. */
  readonly launched: ReadonlySignal<readonly File[]>;
}
