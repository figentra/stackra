---
"@stackra/iam": patch
---

Fix declaration emit for the called form of `Policy` (STA-1680): `Policy<M>` is now an exported interface and the
called form returns the new exported `PolicyClass<M>`, so `class XPolicy extends Policy<X>({ permissions }) {}` no
longer fails with TS4094. Runtime behaviour and permission keys are unchanged.
