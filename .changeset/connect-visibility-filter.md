---
"@stackra/gen": patch
"@stackra/database": minor
---

A service's generated `boot` now calls `connectVisibilityFilter(container)` beside the hold registry and sequence time
zone, so reads AND the bound `VisibilityFilter`'s conditions, `UserStamps` take the running call's actor, and
`callTimeZone()` reads the call's time zone; until now nothing outside tests connected it, so record visibility, user
stamps and the call time zone were all off (STA-2044). The database testing plugin connects the compiled app the same
way on every compile, and the memory database runs the `StampSubscriber`, so unit tests see what production does.
