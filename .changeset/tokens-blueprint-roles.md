---
"@stackra/tokens": minor
---

Blueprint roles for the marketing pages (ADR 0501 section 9, amended 2026-11-03): each material family now sets
`--blueprint-rule`, `-rule-width`, `-mark-size`, `-frame-radius`, `-pipe`, `-pipe-width`, `-junction-size` and
`-dock-height`. `front` draws hairline rules mixed from the accent, pipes in the accent with `+` section marks and 10 px frames;
`studio` keeps them quiet. `BlueprintRole` and `FAMILY_BLUEPRINT` are exported. The motion steps gain `floor` (80 ms on `steps(1)`), the blueprint's build-log reveal.
