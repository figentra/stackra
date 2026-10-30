---
"@stackra/panel": minor
---

Add `pageContextOf(listState, record, selection)` (STA-1631, ADR 0490): the AI page context a panel page publishes with
no declaration, as the structural `PanelPageContext` (the record id, at most 200 selected ids with the full count, and
the list's applied filters). Pure; it imports no AI package.
