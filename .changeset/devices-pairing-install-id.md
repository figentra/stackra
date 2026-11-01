---
"@stackra/devices": patch
---

The pairing status check sends this install's id as the `deviceId` query parameter, so the hub, which binds a pairing
to the install that opened it, no longer refuses the install's own check.
