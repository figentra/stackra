---
"@stackra/platform": minor
---

Add the opt-in app lock (STA-1537): the `AppLock` port, `AppLockConfig` (`platform.app_lock`, off by default, with the
time in the background before it locks again, the passcode fallback and per-role overrides), `appLockPolicy`, the
memory driver, `ExpoAppLockDriver` over expo-local-authentication, and `AppLockGate`, which prompts on launch and on
return, and covers the app in the app switcher. Ships `platform::app_lock.*` in seven locales.
