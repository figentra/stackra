/**
 * Stackra file contract:
 * Purpose: `STANDARD_SHORTCUTS`, the bindings the design system gives its well-known actions by default (the palette
 *          `mod+k`, the cheat sheet `shift+/`, Ask Tamo `mod+j`, confirm `mod+enter`, undo `mod+z`, ...), by action id.
 * Boundary: data only; defaults a tenant or a person may remap. The conflict check reads them, so an app's own binding
 *           cannot silently take `mod+j` from Ask Tamo.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (standard bindings); ADR 0507 (Ask Tamo launcher, `mod+j`).
 */

/** The standard bindings by action id. */
export const STANDARD_SHORTCUTS: Readonly<Record<string, string>> = Object.freeze({
  "palette.open": "mod+k",
  "shortcuts.cheat_sheet": "shift+/",
  "ai.ask": "mod+j",
  "form.submit": "mod+enter",
  "overlay.confirm": "mod+enter",
  "overlay.close": "escape",
  "search.focus": "/",
  "filter.add": "f",
  "toast.undo": "mod+z",
  "collection.select_all": "mod+a",
  "collection.edit": "e",
  "collection.preview": "space",
  "calendar.today": "t",
  "calendar.previous": "mod+left",
  "calendar.next": "mod+right",
  "media.previous": "left",
  "media.next": "right",
  "pagination.previous": "alt+left",
  "pagination.next": "alt+right",
  "copy.run": "mod+shift+c",
});
