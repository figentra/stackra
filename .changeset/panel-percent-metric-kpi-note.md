---
"@stackra/panel": minor
---

`PercentMetric` (with `PercentMetric$`) holds a rate as a ratio, and a KPI bound to it shows a percent in the reader's
locale with its trend in percentage points. A KPI takes `.note(path)`, a muted line under the value worded by the
derived key `<module>::widgets.<widget>.<path>` with `{count}`, so a main-currency tile can say "+2 other currencies".
