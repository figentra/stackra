/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TamoGhostText` takes: the field's text, Tamo's suggestion drawn after it, and the
 *          accept and dismiss callbacks (Tab and Escape on web, buttons on native).
 * Boundary: types only; the field stays the person's: nothing changes until they accept.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `TamoGhostText`. */
export interface TamoGhostTextContractProps {
  /** The field the suggestion is drawn over. */
  readonly children: ReactNode;
  /** The field's current text. */
  readonly value: string;
  /** What Tamo suggests next; empty draws nothing. */
  readonly suggestion: string;
  /** Called with the text plus the suggestion (Tab). */
  readonly onAccept: (next: string) => void;
  /** Called when the suggestion is dismissed (Escape, or typing on). */
  readonly onDismiss: () => void;
}
