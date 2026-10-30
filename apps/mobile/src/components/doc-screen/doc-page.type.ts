/**
 * Stackra file contract:
 * Purpose: `DocPage`, one page of the mobile component screen's pager: the `DocTab` values plus the Hooks page an
 *          entry with native hooks adds after API.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 3.3; ADR 0305 (one declaration per file).
 */
import type { DocTab } from "@stackra/showcase";

/** A page of the component screen. */
export type DocPage = DocTab | "hooks";
