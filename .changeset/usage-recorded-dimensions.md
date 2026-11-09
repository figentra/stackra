---
"@stackra/actions": minor
---

`UsageRecorded` carries optional `dimensions`, a small map the usage service may rate by (`{ market: "eg" }`): at most
8 snake_case keys with values of 1 to 64 characters, so a dimension never holds free text. A service that writes usage
itself (Notify per channel and market) sets them; existing producers are unchanged.
