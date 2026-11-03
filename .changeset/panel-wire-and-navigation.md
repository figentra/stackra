---
"@stackra/panel": minor
---

Resource trees travel as JSON (build-list item 54). `encodeResource(tree)` writes a recorded resource tree as
`ResourceWire`: every action or query class as its versioned key, every enum as its `Enum.of` definition with its case
data, every SDUI spec field kept. `decodeResource(key, wire, refOf)` checks it against the shipped `ResourceWire$`
schema, turns the keys back into the client refs `refOf` answers and rebuilds the enums; a malformed tree or a key with
no ref is refused with `ResourceWireInvalidError`, every problem listed. A manifest entry under `ui.resources` decodes
as it is.

The panel reads what resources and documents declare (build-list item 53). `registerPanelPages({ resources,
documents, layout })` makes each panel route frame the generic pages of its area's resources and the documents whose
route names it, below `PanelShell` and inside the app's layout. `usePanelNavigation()` gives the current panel's
navigation from each `navigation` entry, grouped and ordered, with a view's count as the badge
(`panelNavigationOf` is its pure core). `QuickCreate` offers the resources that opt in with `quickCreate: true` and
opens the create form in a dialog. `DocumentPage` draws a `Document({ kind, blocks })`: a Dashboard's widget tiles
under its range picker, a Page's query tables and registered blocks.
