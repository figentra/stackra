---
"@stackra/panel": minor
---

Resource tables and View pages show an enum code by its localised label (`<module>::enums.<model>_<field>.<code>`,
then `<module>::enums.<field>.<code>`, or the keys a column or entry names with the new `.labels(...)`), and a flag
as a localised yes or no instead of a bare tick or cross.
