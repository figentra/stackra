# @stackra/shortcuts

Stackra shortcuts (was `@stackra/kbd`): the `Shortcut` kind, key bindings with chord sequences, the conflict
detector, the palette list, the key hint, the keyboard bindings and the `runShortcut` test helper. A shortcut is the
one owner of its key and its behaviour: the keyboard, the command palette and the desktop menus all run the same
class.

**Tier:** `tier:lib` (`packages/experience/shortcuts`). Entries `.`, `./react` and `./testing`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/icons` (the `IconName` type) and TanStack Hotkeys (the web and
desktop keyboard driver, used only inside `./react`); React is an optional peer of `./react`.

## What is here

| Entry       | Symbol                                                                                            | Use                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `.`         | `Shortcut`                                                                                        | the kind base: `class XShortcut extends Shortcut({ keys?, group }) {}` |
| `.`         | `ShortcutContext`                                                                                 | what `run(ctx)` receives; open, other packages add members             |
| `.`         | `contributeShortcutContext`                                                                       | how a package supplies its context members at run time                 |
| `.`         | `findShortcutConflicts`, `ShortcutConflictKind`                                                   | the conflict detector gen and `registerShortcuts` use                  |
| `.`         | `registerShortcuts`                                                                               | the generated wiring's call linking each class to its key and label    |
| `.`         | `RunnableShortcut`, `ShortcutClass`, `ShortcutOptions`, `ShortcutConflict`, `ShortcutContextPart` | types                                                                  |
| `./react`   | `useShortcuts`, `ShortcutItem`                                                                    | the palette's entries                                                  |
| `./react`   | `useRunShortcut`                                                                                  | runs the entry the user picked                                         |
| `./react`   | `useShortcut`                                                                                     | `onPress={useShortcut(OpenPaletteShortcut)}` on a button or menu item  |
| `./react`   | `ShortcutKeys`                                                                                    | the key hint: `⌘K` on Apple devices, `Ctrl+K` elsewhere                |
| `./react`   | `ShortcutBindings`                                                                                | mounted once by the generated entry; binds every key                   |
| `./testing` | `runShortcut`                                                                                     | `const { navigations } = await runShortcut(SignOutShortcut)`           |
| `./testing` | `registerShortcutTestingPart`                                                                     | how another package's testing setup fakes its context members          |

## Declaring a shortcut

```ts
// src/shortcuts/toggle-sidebar.shortcut.ts
export class ToggleSidebarShortcut extends Shortcut({
  keys: "mod+b",
  group: I18n.console.palette.group_app,
}) {
  constructor(private readonly ui: UiStore) {
    super();
  }

  run(): void {
    this.ui.toggleSidebar();
  }
}
```

`keys` is modifiers and one key joined by `+` (`mod`, `ctrl`, `alt`, `shift`, `meta`; `mod` is Command on Apple
devices and Control elsewhere), or a chord of such steps separated by spaces (`g s`), each next step awaited for
1.5 seconds. A palette-only entry omits `keys`. A malformed binding throws where the class is declared. The key
(`console.toggle_sidebar`) and the label (`shortcuts::toggle_sidebar.label`) are derived by gen and registered
through `registerShortcuts`; dependencies arrive through the constructor.

## Conflicts

Two bindings conflict when they are the same keys on Apple devices or elsewhere (`mod+k` and `meta+k` clash on a
Mac), or when one is the start of the other's chord (`g` and `g s`). `findShortcutConflicts` reports each pair once;
gen fails the build on one, and `registerShortcuts` refuses the whole batch.

## The context

`ShortcutContext` declares nothing here. A package that offers shortcuts a capability adds its member by
declaration merging and supplies it with `contributeShortcutContext`:

```ts
declare module "@stackra/shortcuts" {
  interface ShortcutContext {
    readonly navigate: (to: RouteRef | string, options?: NavigateOptions) => void;
  }
}

useEffect(() => contributeShortcutContext(() => ({ navigate })), [navigate]);
```

## Testing

`runShortcut(Class, input?)` builds the class, runs it once with the context the registered testing parts fake (and
any input member no part claims, as given) and resolves to the context, the parts' extra members and the instance.
Another package takes part with `registerShortcutTestingPart(name, part)` and declares its extra members on
`ShortcutRun`; this package never imports another package's `./testing` (ADR 0269).
