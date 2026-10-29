---
"@stackra/filesystem": minor
---

Add the `./native` entry with `ExpoFileSystemDriver` (`disk: expo`): an Expo app keeps files on the phone under
`<documents>/<root>` through `expo-file-system`, an optional peer, with writes through a cache file so a crash never
leaves half a file. `memory` stays the default disk, so a target without the native driver keeps files in memory.
