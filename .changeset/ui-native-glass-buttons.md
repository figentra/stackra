---
"@stackra/ui": minor
---

The native Button's secondary, tertiary and outline variants, the IconButton in those variants and the CloseButton's
default draw on Liquid Glass on iOS 26 and later (ADR 0319): a regular, interactive `GlassView` in the colour scheme.
Everywhere else they keep HeroUI Native's solid look: Android, earlier iOS, a disabled button, and while reduced
transparency or darker system colours is on (solid until those settings answer, so glass never flashes). Primary,
ghost and danger stay solid, and a caller's own `background` still wins. `expo-glass-effect` joins the native entry's
optional peers. There is no blur fallback, so `expo-blur` is not needed; without it, HeroUI Native's optional blur
overlay for Dialog and BottomSheet falls back to its default overlay.
