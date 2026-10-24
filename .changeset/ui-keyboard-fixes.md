---
"@stackra/ui": patch
"@stackra/navigation": patch
---

Keyboard and accessibility fixes found by the first end-to-end run of waves 6 and 7:

- `Table` walks its cells with the arrow keys and lands on a cell's link or button, so a `DataTable` row menu is reachable from the keyboard. HeroUI's "tab" navigation left it out of reach.
- `RadioGroup` reads an empty controlled `value` as "nothing chosen", so the group keeps a Tab stop.
- `DatePicker` shows narrow weekday names, so the Arabic calendar fits its grid.
- `NavigationList` draws the current entry's bar as an element, so its text's contrast can be measured.
- `EntityPicker` draws one remove button per tag.
- `RouteOverlay` gives focus back to its opener after Escape closes it.
