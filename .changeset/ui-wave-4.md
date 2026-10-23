---
"@stackra/ui": minor
---

Add the wave 4 overlays, menus, messages and progress indicators to `./react` (HeroUI v3) and `./native` (HeroUI
Native), with their contract props in `./contracts`: `Modal` and `Drawer` (one root with `Header`, `Title`, `Body`,
`Footer` and `Close` parts), `AlertDialog`, `ConfirmationProvider` with `useConfirmation`, `LeaveConfirmation`, `Menu`,
`ActionMenu`, `Popover`, `Tooltip`, `Alert`, `toast` with `ToastProvider`, `ProgressBar` and `ProgressCircle`. Every
overlay takes `isOpen`, `defaultOpen`, `onOpenChange`, `isDismissable` and `isKeyboardDismissDisabled` where they apply,
anchored ones take a reading-direction `placement` and `align`, and messages take `tone` and `icon` and announce by
tone. The kit now registers the `ellipsis` icon and the four tone icons itself. `react-native-reanimated` is a new
optional peer dependency, needed by the native progress indicators.
