---
"@stackra/console": minor
"@stackra/cli": minor
---

`stackra` alone now lists its commands under seven headings, in the order a developer meets them: Create, Develop,
Inspect, Database, Quality, Deploy and Repository. A new app from `stackra create` sees 25 commands instead of about
60: the Stackra core repository's own checks are listed only in that repository, commands for something the workspace
does not use (search, settings, audit, seed packs, a mobile app, web surfaces) appear once it does, and the check
presets and the commands scripts and agent clients run are hidden. Every command still runs by name, and
`stackra list --all` lists them all, its `--json` rows keeping each command's real `hidden` value (STA-2872).
With a mobile app, `eas-preflight` is listed under Deploy and `app-native-deps` under Quality.

`@stackra/console` gains the pieces: `ConsoleConfig.groups` orders the headings, `ConsoleConfig.unlisted` leaves a
command out of one run's list and tab completion, the built-in `list` (and `list --all`) answers when no command takes
that name, and `Renderer.commandList` takes optional `CommandListOptions` (`order`, `more`), so the list can end with
the `list --all` hint.
