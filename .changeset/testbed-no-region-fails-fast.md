---
"@stackra/cli": patch
---

`stackra testbed run` exits 75 at once, with AWS's reason, when no enabled region answers (a bad or expired AWS
profile), instead of waiting until the caller's own timeout; the GitHub fallback still goes first. As figentra/testbed#14.
