---
"@stackra/gen": patch
---

The wiring file also writes `interface PortRegistry` (port key to `typeof <Port>`) beside `DriverRegistry`, so
`DriverName<Port>` narrows without a brand on the port. A hand-written `~key` brand that is not `<member>.<Port>` is
refused with `port_key_mismatch`.
