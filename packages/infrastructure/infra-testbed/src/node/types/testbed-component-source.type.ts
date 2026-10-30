/**
 * Stackra file contract:
 * Purpose: `TestbedComponentSource`, one Image Builder component: its name and its document with placeholders.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0484 (decision 2).
 */

export type TestbedComponentSource = { readonly name: string; readonly document: string };
