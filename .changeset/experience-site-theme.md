---
"@stackra/experience": minor
---

Breaking rename (STA-1383): the section-based storefront theme is `SiteTheme`, so `Theme` means design tokens
(`@stackra/tokens`) everywhere. `Theme`, `ThemeDiff`, `ThemeChange`, `ThemeRevision`, `commitTheme`, `diffTheme`,
`rollbackTheme` and `validateTheme` of `@stackra/experience` are now `SiteTheme`, `SiteThemeDiff`, `SiteThemeChange`,
`SiteThemeRevision`, `commitSiteTheme`, `diffSiteTheme`, `rollbackSiteTheme` and `validateSiteTheme`.
