---
"@stackra/ui": patch
---

The class-component base `Component<P>` (web and native) declares React's class surface as types only (`state`,
`context`, `setState`, `forceUpdate`), so tsc takes a subclass as a JSX element and a `ComponentType` with its props
checked. Nothing is emitted: the compiled component is still a function.
