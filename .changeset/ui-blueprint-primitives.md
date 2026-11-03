---
"@stackra/ui": minor
---

Blueprint primitives for marketing pages on the web (STA-2041), drawn from the `--blueprint-*` roles:
`BlueprintSection` (a ruled band with `+` marks at its top corners), `Frame variant="schematic"` (a striped title bar
on the blueprint frame radius), `Schematic` and `SchematicNode` (named parts joined by measured orthogonal pipes with
junction squares, drawn in on 80 ms floor steps at the full motion level, mirrored in right-to-left by measuring) and
`SectionDock` (a sticky bar of section links with scroll-spy and a status line that is not a live region; under `md`
the other links stay reachable and show while focused). `Illustration` draws a landing drawing in four token-coloured
mask layers (`<src>.<tone>.svg` for ground, dots, line and core) and never mirrors. `useFloorSteps` is the one
whole-step reveal behind `Schematic`, `TerminalDemo` and other floor-step motion. `DitherArt` gains `mode="glyphs"`
(code characters in the mono font), `glyphs` and `sun` (moves the core glow, measured from the inline start); in
right-to-left a dot field now mirrors as a whole, while glyphs never mirror. In left-to-right its defaults draw exactly
as before.
