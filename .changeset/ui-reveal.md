---
"@stackra/ui": minor
---

New `Reveal` (ADR 0329): its child fades in and rises into place on the theme's `reveal` step, delayed by `index`
stagger steps; Motion on the web, a Reanimated entering animation on native. It is still under reduced motion and with
`isAnimated={false}`. `List` now reveals its rows inside its surface on both platforms; `isAnimated={false}` turns that
off. The web entry takes `motion` as a peer dependency.
