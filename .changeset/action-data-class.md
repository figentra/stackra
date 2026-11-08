---
"@stackra/actions": minor
"@stackra/gen": minor
"@stackra/registry": patch
---

An action or a query can name the data class it handles: `dataClass: DataClassification.Financial`, or a product's
own `DataClass({ key })` class. Gen writes the key on the call's manifest entry (`dataClass`) and refuses a value it
cannot read with `data_class_unknown`; the catalogue manifest schema names the field. Tamo's gateway uses it to keep a
run in region by the most sensitive class among the tools it calls.
