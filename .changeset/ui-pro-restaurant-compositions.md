---
"@stackra-pro/ui": minor
---

Add `FloorPlanEditor`, `LiveTableMap` and `KdsBoard` on web and native: a grid floor plan of tables, walls and labels
with drag and keyboard (or screen-reader action) move and resize; the same plan read-only with each table's live
status, lines and suggestion; and a kitchen ticket board with age tones from the caller's steps, rush, allergy and held
flags, line and ticket bump, recall and all-day counts. New contracts `FloorItemShape`, `FloorItem`, `LiveTable`,
`KdsTicket`, `KdsTicketItem`, `KdsAgeTone` and the three `*ContractProps`; new `ui_pro::floor_plan.*`,
`ui_pro::live_table_map.*` and `ui_pro::kds.*` keys in all seven locales (STA-962).
