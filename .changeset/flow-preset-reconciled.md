---
"@stackra/flow-preset": minor
---

The package catches up with Flow's bundled stackra preset, so a repository can switch to it (T142). That brings in:

- the agents' docs links and rule names;
- the guard's executor rules;
- the settings and OpenCode surfaces;
- the opt-in lefthook;
- every edit made to Flow's copy since the package was cut.

Core's own changes stay. It requires Flow 0.11.0 or later (`requires.flow` and the peer), since it relies on 0.11's
opt-in surfaces, projection and fencing.
