---
"@stackra/settings": patch
"@stackra/navigation": patch
---

The native `SettingsForm`, `useMenu`, `useMenus` and the menu flag check now share their logic with the web entry
(`useSettingsForm`, `useMenuResolverWith`, `useMenuFrom`) instead of keeping copies. Behaviour and exports are unchanged.
