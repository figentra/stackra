---
"@stackra/calendar": minor
---

Add the `PrayerTimes` port and its `ComputedPrayerTimesDriver` (ADR 0414): the five prayer times and sunrise of a local
date at a place, computed from the sun's position under a method that is market-pack data (`calendar.prayer_times`,
read with `prayerMethodFromPack` and checked by `PrayerMethod$`: Fajr angle, Isha angle or minutes, Asr factor,
Maghrib minutes and a `HighLatitudeRule`). Notifications use it for quiet hours.
