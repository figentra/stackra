---
"@stackra/container": minor
---

`PortRegistry`, an empty interface gen augments with the class of each port it registers drivers for. `DriverName<P>`
keeps a hand-written `~key` brand first, then narrows an unbranded port to the names of the `PortRegistry` keys whose
class instance is the same type (structural identity; identical unbranded ports give a wider union), and otherwise
stays the union of every registered name.
