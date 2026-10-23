# src/react

The `./react` entry of @stackra/ui (ADR 0294 decision 15): web renderers, one folder each,
`react/<name>/<name>.tsx` with its `__tests__/`. It imports `core/`, never `node/` or `native/`. Its optional peers are
`react-aria-components` and `@heroui/react`.

`./react` names the stand-in barrel `index.ts` (`DesignSystemProvider`, `useDesignSystem`, `Icon`, `Text`,
`Heading`, `Button`, `IconButton`, `CloseButton`, `Link`, `Surface`, `Card`, `Separator`, `Chip`, `StatusBadge`, `Badge`, `Avatar`, `Spinner`, `Skeleton`, `SkeletonGroup` and React Aria's `RouterProvider`) until `stackra gen` writes the entry barrels (STA-339). `Icon` and `Avatar` also need the optional peer `lucide-react`. `SkeletonGroup` is the adapted form: HeroUI v3 has none.
