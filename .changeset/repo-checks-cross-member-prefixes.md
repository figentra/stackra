---
"@stackra/repo-checks": minor
---

The structure phase refuses a public id prefix that models of two different apps or services share (ADR 0135).
Each finding names both models and their files and suggests a prefix no member uses. Members hosting the same
package model keep its prefix; a clash inside one member stays gen's `prefix_duplicate`.
