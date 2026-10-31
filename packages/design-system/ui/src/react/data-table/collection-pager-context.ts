/**
 * Stackra file contract:
 * Purpose: `CollectionPagerContext`, true under a DataView: the view draws the one pager of its engine, so the DataTable
 *          or DataGrid inside it draws none.
 * Boundary: internal to the data family; never exported.
 * Runtime: browser
 * Governing contract: ADR 0505 (one pager, owned by DataView or by a standalone DataTable or DataGrid).
 */
import { createContext } from "react";

/** True when an outer DataView owns the pager. */
export const CollectionPagerContext = createContext(false);
