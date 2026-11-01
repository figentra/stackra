---
"@stackra/gen": patch
---

A generated schema's `X$Check` leaves out its driver-name fields on both sides: `DriverName<Port>` widens to every
registered driver name when the port has no `~key` brand, so a shape with one failed `Same<>` (TS2344). The `X$`
schema still validates the field with `z.enum` of the driver names gen found.
