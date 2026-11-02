---
"@stackra/console": minor
---

Live screens:

- **`io.output.live({ title, rows })`** redraws rows that are pending, running or settled, then writes their final
  checklist. A row still running is written as skipped, a failed row exits 1, and the settled rows are the `--json`
  data (STA-1966).
- **`InkRendererDriver`** (in `@stackra/console/node`, bound by `nodePorts()`) draws live views, spinners, progress bars
  and running tasks through Ink 8 while output animates, and ends each one in the text driver's static lines.
  - Ink and React are imported only the first time a live part animates.
  - If they cannot load, the text output stands.
  - Off a colour terminal, the driver is the text driver.
