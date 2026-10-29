---
"@stackra/native-spotlight": patch
---

`indexableItems` sorts with `sort` on its own filtered copy instead of the ES2023 `toSorted`, and
`SpotlightNativeModule` declares its `addListener` itself, as expo's `NativeModule` type is the module class rather than
an instance; the package typechecks against its ES2022 preset again.
