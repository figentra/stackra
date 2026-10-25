---
"@stackra/ui": minor
---

Wave 7 on native (ADR 0318): `NumberField` on a text input and two steppers, reading and writing numbers with
`@internationalized/number` as the web field does; `DateField` and `DatePicker` on `@expo/ui`'s platform picker
(Android's dialog, iOS's calendar in a dialog), a day kept at local noon so it never moves with the time zone;
`EntityPicker` in an inset sheet with a search and a bounded list; and `DataTable`, `BulkActionBar` and `FilterBar`.
The native `DataTable` takes `scrollEnabled={false}` to lay its rows out inside a page's own `ScrollView`.
`@internationalized/number` joins the native entry's optional peers.
