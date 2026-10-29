<!-- Purpose: the README of @stackra/native-share: what the share port, its drivers, hook, helpers and config plugin are, and how an Expo app receives photos, PDFs, links and text from other apps. Boundary: this package only; the decisions live in the ADRs it names. Runtime: docs. Governing contract: ADR 0478, ADR 0255, ADR 0222, ADR 0465. -->

# @stackra/native-share

Receive photos, PDFs, links and text that a person shares from another app: the iOS share extension and the Android
share target, behind the `IncomingShare` port (ADR 0478). It writes no Swift or Kotlin: Expo's own `expo-sharing`
ships both native sides, and this package's config plugin applies it with what the app takes (ADR 0478 decisions 2
and 9). Anything the configuration refuses is dropped or read as `null`, never thrown.

**Tier:** `tier:lib` (`packages/experience/native-share`). Entries `.`, `./contracts`, `./native` and `./react`, plus
`app.plugin.js` for Expo CLI and the `native_share` catalogues under `./assets/lang/<locale>/`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`, `@stackra/filesystem`,
`@stackra/media` and zod; `expo`, `expo-sharing` (MIT), React and React Native are optional peers of `./native`,
`./react` and the plugin.

## What is here

| Entry         | Symbol                                                             | Use                                                                                       |
| ------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `./contracts` | `IncomingShare`, `SharedItem`                                      | the port (`pending`, `read`, `clear`, `subscribe`) and one shared item                    |
| `.`           | `NativeShareConfig` (+ `NativeShareOptions`, `NativeShareConfig$`) | key `native_share`: `text`, `links`, `fileTypes`, `maxItems`, `maxBytes`, `maxTextLength` |
| `.`           | `IncomingShareDriver`, `MemoryIncomingShareDriver`                 | the base with the configuration's checks; the `memory` driver (tests, web)                |
| `.`           | `keepSharedItem`, `uploadSharedItem`                               | a shared file onto the `FileSystem` disk, or into a media bucket                          |
| `.`           | `sharedItemPath`                                                   | the safe disk key a shared file is kept under (`inbox/<name>`)                            |
| assets        | `native_share::inbox.*`                                            | the inbox screen's strings in en, ar, de, es, fr, it and nl                               |
| `./native`    | `ExpoIncomingShareDriver`                                          | the phone, over expo-sharing                                                              |
| `./react`     | `useIncomingShare`, `IncomingShareState`                           | the waiting items, the port and `clear`                                                   |
| plugin        | `"@stackra/native-share"`                                          | the share extension and intent filters, through expo-sharing's plugin                     |

## Use

```json
// app.json — expo-sharing must also be a dependency of the app
"plugins": [["@stackra/native-share", { "fileTypes": ["image/*", "application/pdf"] }]]
```

```ts
// the container
[IncomingShare, new ExpoIncomingShareDriver(new NativeShareConfig())];

// a screen
const { items, share, clear } = useIncomingShare();
for (const item of items) {
  if (item.kind !== "file") note.append(item.value);
  else if (toUpload) await uploadSharedItem(share, item, uploader, "documents.receipts");
  else await keepSharedItem(share, item, files, sharedItemPath(item)); // on the phone: `disk: expo`
}
await clear();
```

- The plugin's props are `NativeShareConfig`'s fields (plus `appGroupId`) and are parsed by the same schema, so the
  share sheet offers what the driver accepts. An app that overrides the configuration passes the same values to the
  plugin.
- A link must be `http` or `https`; a text over `maxTextLength`, a file of a type outside `fileTypes` and items past
  `maxItems` are dropped; a file over `maxBytes` reads as `null`.
- The Expo driver reads expo-sharing's raw payloads, never its resolved ones, which fetch a shared link before the
  person acted on it. Files sit in the iOS app group or are granted by the sharing app on Android, so no permission
  prompt is involved; uploading or keeping them goes through the app's own `Uploader` and `FileSystem` bindings.
- iOS needs the app group (`group.<bundle identifier>` by default) registered for the app; EAS Build registers it.
- The share extension opens the app at `<scheme>://expo-sharing`; the app maps that path to its share inbox screen.
  A shared file's name comes from another app, so keep it under `sharedItemPath(item)`, never under the raw name.

## Testing

```ts
const share = new MemoryIncomingShareDriver();
share.receive(
  { kind: "file", value: "file:///a.pdf", mimeType: "application/pdf", name: "a.pdf" },
  pdf,
);
expect(await share.pending()).toHaveLength(1);
```
