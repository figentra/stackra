# src/native

The `./native` entry of @stackra/ui (ADR 0294 decision 15): React Native renderers, one folder each,
`native/<name>/<name>.tsx` with its `__tests__/`. It imports `core/`, never `node/` or `react/`. Its optional peers are
`heroui-native`, `uniwind`, `lucide-react-native` and `react-native`.

`./native` names the stand-in barrel `index.ts` (`DesignSystemProvider`, `useDesignSystem`, `Icon`, `Text`,
`Heading`, `Button`, `IconButton`, `CloseButton`, `Link`, `RouterProvider`) until `stackra gen` writes the entry barrels (STA-339). The provider and `Icon` need the optional peer
`lucide-react-native`.
