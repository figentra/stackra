# @stackra/native-spotlight

On-device search for the Stackra phone apps (STA-1540): the signed-in person's own recent records become results of
the phone's own search, iOS Spotlight and Android launcher search, and a tap opens the record in the app through its
deep link. Everything this app put there is removed when the person signs out or the session is revoked, which is how
an erased account reaches the device.

**Tier:** `tier:lib` (`packages/experience/native-spotlight`). An Expo module package (ADR 0478): `src/` (the port,
the rules, the drivers), `ios/` (Swift over Core Spotlight), `android/` (Kotlin over launcher dynamic shortcuts),
`plugin/` (the config plugin) and `expo-module.config.json`. Entries `.`, `./contracts`, `./native` and
`./app.plugin.js`. Expo is an optional peer of `./native`. No maintained library covers both platforms
(`expo-spotlight` and `expo-core-spotlight` are iOS-only), so the module is ours.

## What is here

| Entry         | Symbol                                   | Use                                                                  |
| ------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| `./contracts` | `DeviceSearchIndex`, `DeviceSearchItem`  | the port: `index`, `remove`, `clear`, `opened`                       |
| `.`           | `SpotlightConfig` (+ `SpotlightConfig$`) | the visibility rules (key `native-spotlight.spotlight`)              |
| `.`           | `indexableItems`                         | the rules as a pure function                                         |
| `.`           | `SpotlightIndexer`                       | `sync(userId, records)`, `remove(urls)`, `clearOnSignOut(session)`   |
| `.`           | `MemoryDeviceSearchIndexDriver`          | the `memory` candidate: tests, web, desktop; `open(url)` plays a tap |
| `.`           | `DeviceSearchRecord`, `DeviceSession`    | what the app offers, and the session signals the indexer watches     |
| `./native`    | `ExpoDeviceSearchIndexDriver`            | the phone driver over the `StackraSpotlight` module                  |

## Visibility rules

A record reaches the phone's search only when every rule holds (`indexableItems`):

- someone is signed in and the record's `ownerId` is that person: never a colleague's record, even one they may read;
- its `kind` is listed in `SpotlightConfig.kinds`, which is empty by default, so a product opts each kind in;
- it is not `isSensitive` (health data, a matter behind an ethical wall);
- it changed within `maxAgeDays` (30), and it is among the newest `maxItems` (50);
- it has a deep link.

The server's record visibility (ADR 0333) applies first: the app offers only records it already read.

## Using it

```ts
import {
  SpotlightConfig as BaseSpotlightConfig,
  SpotlightIndexer,
} from "@stackra/native-spotlight";
import { DeviceSearchIndex } from "@stackra/native-spotlight/contracts";
import { ExpoDeviceSearchIndexDriver } from "@stackra/native-spotlight/native";

export class SpotlightConfig extends BaseSpotlightConfig {
  override kinds = ["crm.customer", "sales.order"];
}

// container overrides
([DeviceSearchIndex, new ExpoDeviceSearchIndexDriver()],
  // at launch: clear on sign-out or revocation (OfflineSession from @stackra/query/contracts fits DeviceSession)
  indexer.clearOnSignOut(container.get(OfflineSession)));
// after the recent records load, and again when they change
await indexer.sync(session.user?.id ?? null, recent.map(toDeviceSearchRecord));
```

Deep links: on Android a result is an ordinary `VIEW` intent, so React Navigation's linking config receives it through
`Linking`. On iOS a result arrives as a Core Spotlight activity, so the app adds the index to its linking config:

```ts
const linking = {
  prefixes: ["figentra://"],
  subscribe(listener) {
    const stopLinking = Linking.addEventListener("url", ({ url }) => listener(url));
    const stopSearch = container.get(DeviceSearchIndex).opened(listener); // also the result that launched the app
    return () => {
      stopLinking.remove();
      stopSearch();
    };
  },
};
```

Add `"@stackra/native-spotlight"` to the app's dependencies and its `plugins`; autolinking builds the module at
prebuild.

## Platform notes

- iOS: one named index created with complete file protection, so entries are searchable only while the phone is
  unlocked. The link is the entry's unique identifier and the kind its domain identifier.
- Android: entries are dynamic shortcuts (androidx.core `ShortcutManagerCompat`), which launcher search lists. The
  launcher keeps only its per-activity limit (about 15), newest first, and a long press on the app icon shows the top
  few. `clear` removes only this module's shortcuts.
- Elsewhere (web, desktop, Expo Go) the memory driver or a missing module keeps nothing and never throws.

## Testing

```ts
const index = new MemoryDeviceSearchIndexDriver();
const indexer = new SpotlightIndexer(buildConfig(SpotlightConfig), index);
await indexer.sync("usr_1", [record]);
expect([...index.items.keys()]).toEqual([record.url]);
```

The Swift and Kotlin are checked on devices, not on a developer Mac.
