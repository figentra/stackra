---
"@stackra/tokens": minor
---

The stackra theme gets the brand's steel blue as its accent (ADR 0319).

- `accent` is `oklch(0.5 0.12 248)` light and `oklch(0.72 0.11 248)` dark, with steel-blue hover, pressed and soft steps.
- `focus` takes the accent.
- `accent-foreground` stays paper and ink: 5.49:1 and 7.88:1 on the accent.

The web stylesheet puts HeroUI's secondary, tertiary and outline button variants and the default close button on the glass material's control fill (the thick level, floored at the frosted mode's floor, with an edge and no backdrop filter), and the ghost variant on it under the pointer. Primary and danger stay solid. Under `DesignSystemProvider` an app runs in the `solid` material by default, so its quiet buttons stay opaque until it asks for glass.
