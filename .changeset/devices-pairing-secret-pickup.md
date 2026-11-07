---
"@stackra/devices": minor
---

Device pairing no longer takes the credential from the status poll. `HttpDevicePairingDriver.begin` mints a 256-bit
pairing secret, keeps it in the `secrets` area and sends it in the body of `POST /device-pairings`; `check` polls
`GET /device-pairings/:pairingId` for the state only and, once paired, picks the token up once from
`POST /device-pairings/:pairingId/pickup` with the secret in the body. A pickup the hub answers with 409 (not issued
yet) reads as pending; a wrong or spent secret is refused. New: `DEVICE_HUB_PATHS.pickup`,
`DEVICE_STORAGE_KEYS.pairingSecret`. Needs a hub that serves the pickup (figentra/os devices).
