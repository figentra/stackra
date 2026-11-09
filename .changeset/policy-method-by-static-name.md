---
"@stackra/container": minor
"@stackra/iam": patch
---

A record policy's method is found by the name of the `Permission` static behind the call's permission
(`static readonly confirmByCode` → `confirmByCode()`), so a multi-word verb's method runs. `registerPermissions`
records each key's static name in `PERMISSION_MEMBERS`. For one release the old lookup by the key's last segment
(`confirm_by_code`) is still tried when the policy has no method of the static's name.
