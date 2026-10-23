# src/native

The `./native` entry of @stackra/ui (ADR 0294 decision 15): React Native renderers, one folder each,
`native/<name>/<name>.tsx` with its `__tests__/`. It imports `core/`, never `node/` or `react/`. Its optional peers are
`heroui-native`, `uniwind` and `react-native`.

`./native` names the stand-in barrel `index.ts` (`DesignSystemProvider`, `useDesignSystem`) until `stackra gen`
writes the entry barrels (STA-339).
