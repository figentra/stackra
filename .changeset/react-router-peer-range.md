---
"@stackra/app": patch
"@stackra/navigation": patch
---

The `react-router` peer is `^7.18.4` instead of the exact `7.18.4`, so a consumer can take react-router's later 7.x
security fixes without an override (STA-1736).
