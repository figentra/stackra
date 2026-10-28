---
"@stackra/analytics": minor
---

Delivery follows the phone's power and data saving (STA-1536): while `SystemSettings` reports Low Power Mode or an
expensive connection, a buffer ignores `flushAt` and waits four flush windows, leaving at once only at `bufferLimit`.
