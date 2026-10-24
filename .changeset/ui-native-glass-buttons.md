---
"@stackra/ui": minor
---

The native Button's secondary, tertiary and outline variants, the IconButton in those variants and the CloseButton's
default draw on glass (ADR 0319): Liquid Glass where the platform runs it, else an `expo-blur` view under the theme's
`surface` at the regular fill share, and HeroUI Native's solid look while reduced transparency, darker system colours or
high text contrast is on. Primary, ghost and danger stay solid, and a caller's own `background` still wins.
`expo-glass-effect` and `expo-blur` join the native entry's optional peers.
